const approot = require('app-root-path');
const logger = require(`${approot}/config/winston`)('scape_courses task');
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const uwapi = require('../config/uwopendata_api');
const coursediff = require('../utils/course_diff');
const timeOut = require(`${approot}/utils/delay`);

/**
 * Update our course details with new changes from UW API
 * This does not include class schedules
 *
 * First, request all the available course.
 * Compare it with the saved collection from last time.
 * If the collection does not exist, update every Course
 * If the collection exists, update only the difference
 *
 * @param options
 * @returns {Promise<void>}
 */
module.exports = async (options) => {
    logger.info(`Starting scrape_courses`);

    options = Object.assign({
        // a dictionary of courses by course_id
        docPath: `${approot}/uwopendata/data/courses.json`,
        // an array of all courses
        docPathArray: `${approot}/uwopendata/data/courses_array.json`,
        docEncoding: 'utf8',
        batchSize: 300,
        batchDelay: 500,
        firstRun: false
    }, options);

    let res_dict = {}; // dictionary of courses by course_id
    let file_exist = true; // check of the cache file exists

    {
        // res contains a list of all courses
        // the message field is thrown away
        var res = (await uwapi.get('/courses', {})).data;

        // create a dict of courses from res
        for (let entry of res) {
            if (res_dict.hasOwnProperty(entry.course_id))
                res_dict[entry.course_id].push(entry);
            else
                res_dict[entry.course_id] = [entry];
        }

        {
            logger.verbose(`Requesting details of ${res.length} courses, one by one`);

            // Create a queue of parameters for GET requests
            let queue = [];
            for (const e of res) {
                queue.push({endpoint: `/courses/${e.subject}/${e.catalog_number}`, qs: {}});
            }

            // details_data contain an array of all responses, each corresponds to a course, from the UW API
            let details_data = [];

            // Since there might be too many courses, we need to put a delay between our requests
            const requestInBatch = async () => {
                while (queue.length > 0) {
                    let batch_result = await Promise.all(queue.slice(0, options.batchSize).map(e => uwapi.get(e.endpoint, e.qs)));
                    queue = queue.slice(options.batchSize);
                    await timeOut(options.batchDelay);
                    for (let e of batch_result)
                        details_data.push(e.data);
                }
            };
            try {
                await requestInBatch();
                logger.verbose(`Fetched details of ${details_data.length}/${res.length} courses`);
            } catch (error) {
                logger.error(`Failed to fetch details of ${res.length} courses`);
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

    if (!options.firstRun) {
        // Check if DOC_PATH exists
        try {
            await fs.promises.access(options.docPath, fs.constants.F_OK);
        } catch (err) {
            if (err.code === 'ENOENT')
                file_exist = false;
            else throw Error(err);
        }
        logger.verbose(`${options.docPath} ${file_exist ? 'exist' : 'does not exist'}`);
    }

    var items = [];
    if (!file_exist || options.firstRun) {
        logger.verbose('Updating the whole database');
        items = coursediff.newCourses([], res_dict);
    } else {
        logger.verbose('Loading previous state documents and compare');
        let previous_state = JSON.parse(await fs.promises.readFile(options.docPath, options.docEncoding));
        items = coursediff.newCourses(previous_state, res_dict);
        items = items + coursediff.generateModifications(previous_state, res_dict);
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
        logger.verbose(`Saving course details as dictionary to ${options.docPath}`);
        await fs.promises.writeFile(options.docPath, JSON.stringify(res_dict), options.docEncoding);
        logger.verbose(`Updated ${options.docPath}`);
    } catch (err) {
        logger.error(err);
        throw Error(err);
    }

    try {
        logger.verbose(`Saving course array to ${options.docPathArray}`);
        await fs.promises.writeFile(options.docPathArray, JSON.stringify(res), options.docEncoding);
        logger.verbose(`Updated ${options.docPathArray}`);
    }
    catch (err) {
        logger.error(err);
        throw Error(err);
    }

    logger.info(`scrape_courses succeeded`);
};
