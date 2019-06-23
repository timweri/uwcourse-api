const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const uwapi = require('../config/uwopendata_api');
const timeOut = require(`${approot}/utils/delay`);
const fail = require('./utils/fail_task')(logger, TAG);
const getCurrentTermId = require('./utils/current_term_id')(logger, TAG);

/**
 * Update our course details with new changes from UW OpenData API
 * These details do not include class schedules
 *
 * First, request a list of all available courses.
 * Then, send one request for details of each course.
 *
 * Update the Course database.
 *
 * At the end, save courses as two local json files:
 *  - courses.json: a dictionary of all courses organized by course_id (includes
 *      all fields requested)
 *  - courses_array.json: an array of all courses (only includes course_id, subject,
 *      title and catalog_number)
 *
 * @param options
 * @returns {Promise<int>}
 */
module.exports = async (options) => {
    logger.info(`Starting ${TAG}`);

    options = Object.assign({
        // a dictionary of courses by course_id
        dictCoursesArchivePath: `${approot}/uwopendata/data/courses.json`,
        // an array of all courses
        listCoursesArchivePath: `${approot}/uwopendata/data/courses_array.json`,
        archiveEncoding: 'utf8',
        batchSize: 50,
        batchDelay: 500,
    }, options);

    let listCourses; // an array of all courses in the format given by /courses
    let dictCourses = {}; // dictionary of courses by course_id
    let currentTermId;

    try {
        currentTermId = await getCurrentTermId();
    } catch (err) {
        return fail(err);
    }

    try {
        logger.verbose('Requesting a list of all courses');
        listCourses = (await uwapi.get('/courses', {})).data;
        logger.verbose(`Received a list of ${listCourses.length} courses`);
    } catch (err) {
        return fail(err);
    }

    // Take only 1000 for testing
    listCourses = listCourses.slice(0, 50);

    // create a dict of courses from listCourses
    for (const item of listCourses) {
        // Some courses a crosslisted and thus have the same course_id
        // Each item of dictCourses is thus a list to store multiple items
        if (dictCourses.hasOwnProperty(item.course_id))
            dictCourses[item.course_id].push(item);
        else
            dictCourses[item.course_id] = [item];
    }

    try {
        logger.verbose(`Saving course array to ${options.listCoursesArchivePath}`);

        await fs.promises.writeFile(options.listCoursesArchivePath, JSON.stringify(listCourses), options.archiveEncoding);
        logger.verbose(`Updated ${options.listCoursesArchivePath}`);
    } catch (err) {
        return fail(err, [`Saving course array to ${options.listCoursesArchivePath} failed`]);
    }

    try {
        logger.verbose(`Saving course details as dictionary to ${options.dictCoursesArchivePath}`);
        await fs.promises.writeFile(options.dictCoursesArchivePath, JSON.stringify(dictCourses), options.archiveEncoding);
        logger.verbose(`Updated ${options.dictCoursesArchivePath}`);
    } catch (err) {
        return fail(err, [`Saving course details as dictionary to ${options.dictCoursesArchivePath} failed`]);
    }

    dictCourses = null;

    // Create a queue of parameters for GET requests
    let queueParameters = [];
    for (const item of listCourses) {
        queueParameters.push({endpoint: `/courses/${item.subject}/${item.catalog_number}`, qs: {}});
    }
    listCourses = null;

    const updateInBatch = async () => {
        while (queueParameters.length > 0) {
            const batchResult = await Promise.all(queueParameters.slice(0, options.batchSize)
                .map(e => uwapi.get(e.endpoint, e.qs)));
            queueParameters = queueParameters.slice(options.batchSize);
            await timeOut(options.batchDelay);

            // Upsert only those not found in the archive
            const bulkOp = Course.collection.initializeUnorderedBulkOp();
            for (const item of batchResult) {
                const itemData = item.data;
                bulkOp.find({
                    course_id: itemData.course_id,
                    subject: itemData.subject,
                    catalog_number: itemData.catalog_number,
                    term_id: currentTermId.internal_id,
                }).upsert().updateOne({
                    $set: {
                        title: itemData.title,
                        url: itemData.url,
                        units: itemData.units,
                        academic_level: itemData.academic_level,
                        description: itemData.description,
                        instructions: itemData.instructions,
                        prerequisites: itemData.prerequisites,
                        corequisites: itemData.corequisites,
                        crosslistings: itemData.crosslistings,
                        terms_offered: itemData.terms_offered,
                        offerings: itemData.offerings,
                        needs_department_consent: itemData.needs_department_consent,
                        needs_instructor_consent: itemData.needs_instructor_consent,
                        notes: itemData.notes,
                        extra: itemData.extra,
                        updated_at: new Date(),
                    },
                    $setOnInsert: {
                        created_at: new Date(),
                        course_id: itemData.course_id,
                        subject: itemData.subject,
                        term_id: currentTermId.internal_id,
                        catalog_number: itemData.catalog_number,
                    },
                });
            }
            const upsertResult = await bulkOp.execute();
            logger.info(`Successfully created ${upsertResult.nUpserted} and modified ${upsertResult.nModified}` +
                ' courses on database');
        }
    };
    try {
        await updateInBatch();
    } catch (err) {
        return fail(err);
    }

    logger.info(`${TAG} finished`);
    return 0;
};
