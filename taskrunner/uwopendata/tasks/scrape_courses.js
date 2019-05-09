const approot = require('app-root-path');
const logger = require(`${approot}/config/winston`)('scape_courses task');
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const uwapi = require('../config/uwopendata_api');
const coursediff = require('../utils/course_diff');
const timeOut = require(`${approot}/utils/delay`);

/**
 * Update our course details with new changes from UW OpenData API
 * These details do not include class schedules
 *
 * First, request a list of all available courses.
 * Then, send one request for details of each course.
 *
 * Compare result with the saved collection from the previous execution of the task.
 * If the collection does not exist, update every courses.
 * If the collection exists, update only the difference.
 * New courses are created.
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
    logger.info(`Starting scrape_courses`);

    options = Object.assign({
        // a dictionary of courses by course_id
        doc_path: `${approot}/uwopendata/data/courses.json`,
        // an array of all courses
        doc_path_array: `${approot}/uwopendata/data/courses_array.json`,
        doc_encoding: 'utf8',
        batch_size: 300,
        batch_delay: 500,
        first_run: false
    }, options);

    let courses_dict = {}; // dictionary of courses by course_id
    let doc_path_exist = true; // check if the doc_path file exists

    {
        // request for a list of all courses
        // remove the message field of the response
        logger.verbose(`Requesting a list of all courses`);
        var course_list = (await uwapi.get('/courses', {})).data;

        // create a dict of courses from course_list
        for (let item of course_list) {
            if (courses_dict.hasOwnProperty(item.course_id))
                courses_dict[item.course_id].push(item);
            else
                courses_dict[item.course_id] = [item];
        }

        {
            logger.verbose(`Requesting details of ${course_list.length} courses, one by one`);

            // Create a queue of parameters for GET requests
            let queue = [];
            for (const item of course_list) {
                queue.push({endpoint: `/courses/${item.subject}/${item.catalog_number}`, qs: {}});
            }

            // details_data contain an array of all responses, each corresponds to a course, from the UW API
            let details_data = [];

            // Since there might be too many courses, we need to put a delay between our requests
            const requestInBatch = async () => {
                while (queue.length > 0) {
                    let batch_result = await Promise.all(queue.slice(0, options.batch_size)
                        .map(e => uwapi.get(e.endpoint, e.qs)));
                    queue = queue.slice(options.batch_size);
                    await timeOut(options.batch_delay);
                    for (let e of batch_result)
                        details_data.push(e.data);
                }
            };
            try {
                await requestInBatch();
                logger.verbose(`Fetched details of ${details_data.length}/${course_list.length} courses`);
            } catch (error) {
                logger.error(`Failed to fetch details of ${course_list.length} courses`);
                return;
            }

            // merge the `/courses` response with the `/courses/course_id` responses
            // since the response from `/courses` contain a subset of the fields we need, we will reuse it
            details_data.forEach((detailed_course) => {
                let courses_by_id = courses_dict[detailed_course.course_id];
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

    if (!options.first_run) {
        // Check if DOC_PATH exists
        try {
            await fs.promises.access(options.doc_path, fs.constants.F_OK);
        } catch (err) {
            if (err.code === 'ENOENT')
                doc_path_exist = false;
            else throw Error(err);
        }
        logger.verbose(`${options.doc_path} ${doc_path_exist ? 'exist' : 'does not exist'}`);
    }

    var items = [];
    if (!doc_path_exist || options.first_run) {
        logger.verbose('Updating the whole database');
        items = coursediff.newCourses([], courses_dict);
    } else {
        logger.verbose('Loading previous state documents and compare');
        let previous_state = JSON.parse(await fs.promises.readFile(options.doc_path, options.doc_encoding));
        items = coursediff.newCourses(previous_state, courses_dict);
        items = items + coursediff.generateModifications(previous_state, courses_dict);
    }

    try {
        const upsert_result = await Course.upsertMany(items);
        logger.verbose(`Successfully updated ${upsert_result.nUpserted} and created ${upsert_result.nModified} ` +
            `courses on database`);
    } catch (err) {
        logger.error(`Failed to update Course model`);
        logger.error(err);
        throw Error(err);
    }

    try {
        logger.verbose(`Saving course details as dictionary to ${options.doc_path}`);
        await fs.promises.writeFile(options.doc_path, JSON.stringify(courses_dict), options.doc_encoding);
        logger.verbose(`Updated ${options.doc_path}`);
    } catch (err) {
        logger.error(err);
        throw Error(err);
    }

    try {
        logger.verbose(`Saving course array to ${options.doc_path_array}`);

        // Drop the course title since we are not using it
        for (let item in course_list) {
            delete item.title;
        }

        await fs.promises.writeFile(options.doc_path_array, JSON.stringify(course_list), options.doc_encoding);
        logger.verbose(`Updated ${options.doc_path_array}`);
    }
    catch (err) {
        logger.error(err);
        throw Error(err);
    }

    logger.info(`scrape_courses succeeded`);
};
