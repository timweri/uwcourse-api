const approot = require('app-root-path');
const logger = require(`${approot}/config/winston`)('scape_courses_schedule task');
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const uwapi = require('../config/uwopendata_api');
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
    logger.info(`Starting scrape_courses_schedule`);

    options = Object.assign({
        doc_path: `${approot}/uwopendata/data/courses_array.json`,
        doc_encoding: 'utf8',
        batch_size: 300,
        batch_delay: 500,
    }, options);

    let courses_list = []; // dictionary of courses by course_id

    // Read the list of courses created by scrape_courses
    try {
        courses_list = JSON.parse(await fs.promises.readFile(options.doc_path, options.doc_encoding));
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.verbose(`${options.doc_path} does not exist`);
            logger.info(`scrape_courses_schedule failed`);
            return;
        } else throw Error(err);
    }

    let queue = [];
    for (const e of courses_list) {
        queue.push({endpoint: `/courses/${e.subject}/${e.catalog_number}/schedule`, qs: {}});
    }

    let schedule_data = [];

    const requestInBatch = async () => {
        let progress = 0;
        while (queue.length > 0) {
            let batch_result = await Promise.all(queue.slice(0, options.batch_size)
                .map(e => uwapi.get(e.endpoint, e.qs)));
            queue = queue.slice(options.batch_size);
            await timeOut(options.batch_delay);
            for (let [index, item] of batch_result) {
                let item_data = item.data;
                let current_courses_list_item = courses_list[progress + index];
                let new_data = {
                    find: {
                        course_id: current_courses_list_item.course_id,
                        subject: current_courses_list_item.subject,
                        catalog_number: current_courses_list_item.catalog_number,
                    },
                    data: 
                };
                delete item.units;
                delete item.
            }
        }
    };

    logger.info(`scrape_courses_schedule succeeded`);
};
