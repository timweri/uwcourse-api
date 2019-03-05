const approot = require('app-root-path');
const logger = require(`${approot}/config/winston`)('scape_courses task');
const fs = require('fs');
const coursemodel = require(`${approot}/models/Course`);
const uwapi = require('../config/uwopendata_api');
const coursediff = require('../utils/course_diff');
const timeOut = require(`${approot}/utils/delay`);

/**
 * Update our Course collection with new changes from UW API
 *
 * First, request all the available course.
 * Compare it with the saved collection from last time.
 * If the collection does not exist, update every Course
 * If the collection exists, update only the difference
 *
 * @param options
 * @returns {Promise<void>}
 */
module.exports = async (options = {
    docPath: `${approot}/uwopendata/data/courses.json`,
    docEncoding: 'utf8',
    batchSize: 20,
    batchDelay: 500,
}) => {
    // convert an array of courses to a dictionary of courses
    let res_dict = {};
    let file_exist = true;

    {
        // res contains a list of all courses
        // the message node is thrown away
        let res = (await uwapi.get('/courses', {})).data;

        // filter out incorrect entries
        res = res.filter((e) => {
            return !e.catalog_number.includes('`');
        });

        res.forEach(e => {
            if (e.catalog_number === '774`') return;
            if (res_dict[e.course_id]) {
                res_dict[e.course_id].push(e);
            } else {
                res_dict[e.course_id] = [e];
            }
        });

        {
            logger.info(`Requesting details of ${res.length} courses, one by one`);

            // Create a queue of parameters for GET requests
            let queue = [];
            for (const e of res) {
                queue.push({ endpoint: `/courses/${e.subject}/${e.catalog_number}`, qs: {}});
            }

            // details_data contain an array of all responses, each corresponds to a course, from the UW API
            let details_data = [];

            // Since there might be too many courses, we need to put a delay between our requests
            const requestInBatch = async () => {
                while (queue.length > 0) {
                    let batch_result = await Promise.all(queue.slice(0,options.batchSize).map(e => uwapi.get(e.endpoint, e.qs)));
                    queue = queue.slice(options.batchSize);
                    await timeOut(options.batchDelay);
                    for (let e of batch_result)
                        details_data.push(e.data);
                }
            };
            try {
                await requestInBatch();
                logger.info(`Fetched details of ${details_data.length}/${res.length} courses`);
            } catch (error) {
                logger.debug(`Failed to fetch details of ${res.length} courses`);
                return;
            }

            // merge the `/courses` response with the `/courses/course_id` responses
            // since the response from `/courses` contain a subset of the fields we need, we will reuse it
            details_data.forEach((detailed_course) => {
                let courses_by_id = res_dict[detailed_course.course_id];
                courses_by_id.forEach((res_course, index) => {
                    if (res_course.subject === detailed_course.subject &&
                        res_course.catalog_number === detailed_course.catalog_number) {
                        courses_by_id[index] = Object.assign({
                            units: detailed_course.units,
                            description: detailed_course.description,
                            instructions: detailed_course.instructions,
                            prerequisites: detailed_course.prerequisites,
                            corequisites: detailed_course.corequisites,
                            antirequisites: detailed_course.antirequisites,
                            crosslistings: detailed_course.crosslistings,
                            notes: detailed_course.notes,
                            offerings: detailed_course.offerings,
                            needs_department_consent: detailed_course.needs_department_consent,
                            needs_instructor_consent: detailed_course.needs_instructor_consent,
                            extra: detailed_course.extra,
                            url: detailed_course.url,
                            academic_level: detailed_course.academic_level,
                        }, res_course);
                    }
                });
            });
        }
    }

    // Check if DOC_PATH exists
    try {
        await fs.promises.access(options.docPath, fs.constants.F_OK);
    } catch (err) {
        if (err.code === 'ENOENT')
            file_exist = false;
        else throw Error(err);
    }
    logger.info(`${options.docPath} ${file_exist ? 'exist' : 'does not exist'}`);
    if (!file_exist) {
        logger.info('Updating the whole database');
        let new_courses = coursediff.newCourses([], res_dict);
        let bulk = coursemodel.collection.initializeUnorderedBulkOp();
        for (let c of new_courses) {
            bulk.find({
                course_id: c.course_id,
                subject: c.subject,
                catalog_number: c.catalog_number
            }).upsert().updateOne(c);
        }
        await bulk.execute();
        logger.info(`Successfully updated ${new_courses.length} courses on database`);
    } else {
        logger.info('Loading previous state documents and compare');
        let previous_state = JSON.parse(await fs.promises.readFile(options.docPath, options.docEncoding));
        let new_courses = coursediff.newCourses(previous_state, res_dict);
        let diff_courses = coursediff.generateModifications(previous_state, res_dict);

        logger.info('Generating bulk write operations to update Courses collection');
        let bulk = coursemodel.collection.initializeUnorderedBulkOp();
        for (let c of new_courses) {
            bulk.find({
                course_id: c.course_id,
                subject: c.subject,
                catalog_number: c.catalog_number
            }).upsert().updateOne(c);
        }

        for (let c of diff_courses) {
            bulk.find(c.find).updateOne(c.update());
        }
        await bulk.execute();
        logger.info(`Successfully updated ${new_courses.length} new courses and ${diff_courses.length} other courses ` +
            `on database`);
    }

    logger.info(`Saving database state to ${options.docPath}`);
    try {
        await fs.promises.writeFile(options.docPath, JSON.stringify(res_dict), options.docEncoding);
        logger.info(`Updated ${options.docPath}`);
    } catch (err) {
        logger.error(err);
        throw Error(err);
    }
};
