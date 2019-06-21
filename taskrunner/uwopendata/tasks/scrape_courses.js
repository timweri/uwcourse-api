const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const uwapi = require('../config/uwopendata_api');
const timeOut = require(`${approot}/utils/delay`);

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
 * @returns {Promise<void>}
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

    {
        logger.verbose('Requesting current term id');
        currentTermId = (await uwapi.get('/terms/list', {})).data.current_term.toString();
        logger.verbose(`Current term id: ${currentTermId}`);
    }

    // request for a list of all courses
    // remove the message field of the response
    logger.verbose('Requesting a list of all courses');
    listCourses = (await uwapi.get('/courses', {})).data;
    logger.verbose(`Received a list of ${listCourses.length} courses`);

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

        // Drop the course title since we are not using it
        for (const item in listCourses) {
            delete item.title;
        }

        await fs.promises.writeFile(options.listCoursesArchivePath, JSON.stringify(listCourses), options.archiveEncoding);
        logger.verbose(`Updated ${options.listCoursesArchivePath}`);
    } catch (err) {
        logger.error(err);
        logger.error(`Saving course array to ${options.listCoursesArchivePath} failed`);
        logger.warning(`${TAG} failed`);
        throw Error(err);
    }

    try {
        logger.verbose(`Saving course details as dictionary to ${options.dictCoursesArchivePath}`);
        await fs.promises.writeFile(options.dictCoursesArchivePath, JSON.stringify(dictCourses), options.archiveEncoding);
        logger.verbose(`Updated ${options.dictCoursesArchivePath}`);
    } catch (err) {
        logger.error(err);
        logger.error(`Saving course details as dictionary to ${options.dictCoursesArchivePath} failed`);
        logger.warning(`${TAG} failed`);
        throw Error(err);
    }
    dictCourses = null;

    {
        // Create a queue of parameters for GET requests
        let queueParameters = [];
        for (const item of listCourses) {
            queueParameters.push({endpoint: `/courses/${item.subject}/${item.catalog_number}`, qs: {}});
        }
        listCourses = null;

        // Since there might be too many courses, we need to put a delay between our requests
        // TODO: Refactor this for reuse in other modules
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
                        term_id: currentTermId,
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
                            term_id: currentTermId,
                            catalog_number: itemData.catalog_number,
                        },
                    });
                }
                const upsertResult = await bulkOp.execute();
                logger.info(`Successfully created ${upsertResult.nUpserted} and modified ${upsertResult.nModified}` +
                    'courses on database');
            }
        };
        try {
            await updateInBatch();
        } catch (error) {
            logger.error(error);
            logger.error('Error during batch processing');
            logger.warning(`${TAG} failed`);
            return;
        }
    }

    logger.info(`${TAG} finished`);
};
