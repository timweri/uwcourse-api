const approot = require('app-root-path');
const logger = require(`${approot}/config/winston`)('scape_courses_schedule task');
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const CourseSchedule = require(`${approot}/models/CourseSchedule`);
const uwapi = require('../config/uwopendata_api');
const timeout = require(`${approot}/utils/delay`);
const TAG = "scrape_courses_schedule";

/**
 * Update our course schedule with new changes from UW API
 *
 * First, read the latest archived list of courses created by `scrape_courses`.
 * Terminates if the archived list of not found.
 * Then, for each course in the list, send a request to 
 * `/courses/subject/catalog_number/schedule` to obtain the new schedule.
 *
 * First, request all the available course.
 * Compare the updated_at timestamp it with the saved dictionary of schedules.
 * If the collection does not exist, update every Course and update the dictionary.
 * If the collection exists, update only the ones that differs in timestamp.
 *
 * For now, we are only concerned with current term schedules.
 *
 * @param options
 * @returns {Promise<void>}
 */
module.exports = async (options) => {
    logger.info(`Starting ${TAG}`);

    options = Object.assign({
        listCoursesArchivePath: `${approot}/uwopendata/data/courses_array.json`,
        archiveEncoding: 'utf8',
        batchSize: 300,
        batchDelay: 500,
        firstRun: false,
    }, options);

    let listCourses = []; // list of courses by course_id
    let currentTermId = 0; // the id of the current term

    // Read the list of courses created by scrape_courses
    // Terminates if the list is not found
    try {
        listCourses = JSON.parse(await fs.promises.readFile(options.listCoursesArchivePath, options.archiveEncoding));
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.warning(`${options.listCoursesArchivePath} does not exist`);
            logger.warning(`scrape_courses_schedule failed`);
            return;
        } else throw Error(err);
    }

    {
        // Request for code of current term
        currentTermId = (await uwapi.get(`/terms/list`, {})).data.current_term;
    }

    let queue = []; // a queue of HTTP request, each item is for one course

    for (const e of listCourses) {
        queue.push({endpoint: `/courses/${e.subject}/${e.catalog_number}/schedule`, qs: {}});
    }

    let bulkOperationCourse = Course.collection.initializeUnorderedBulkOp();
    let bulkOperationScheduleItems = [];
    let nSuccessfuleScheduleQuery = 0;

    const requestInBatch = async () => {
        while (queue.length > 0) {
            // Get the schedule in batches
            let batchResult = await Promise.all(queue.slice(0, options.batchSize)
                .map((e) => uwapi.get(e.endpoint, e.qs)));
            queue = queue.slice(options.batchSize);
            await timeout(options.batchDelay);

            nSuccessfuleScheduleQuery += batchResult.length;

            // For each course
            for (let courseItem of batchResult) {
                if (courseItem.meta.status === 204) continue;
                let courseItemData = courseItem.data;
                for (let section of courseItemData) {
                    bulkOperationCourse.find({
                        subject: section.subject,
                        catalog_number: section.catalog_number,
                    }).updateOne({
                        $addToSet: {[`class_number_map.${currentTermId}`]: section.class_number.toString()},
                        $set: {updated_at: new Date()},
                    });
                    bulkOperationScheduleItems.push({
                        subject: section.subject,
                        catalog_number: section.catalog_number,
                        term_id: currentTermId,
                        campus: section.campus,
                        note: section.note,
                        class_number: section.class_number,
                        enrollment_capacity: section.enrollment_capacity,
                        enrollment_total: section.enrollment_total,
                        waiting_capacity: section.waiting_capacity,
                        waiting_total: section.waiting_total,
                        reserves: section.reserves,
                        classes: section.classes,
                        last_updated: new Date(section.last_updated),
                        updated_at: new Date(),
                    });
                }
            }
        }
    };

    try {
        await requestInBatch();
        logger.verbose(`Fetched schedules of ${nSuccessfuleScheduleQuery}/${listCourses.length} courses`);
    } catch (error) {
        logger.error(error);
        logger.error(`Failed to fetch schedules of ${listCourses.length} courses`);
        return;
    }

    try {
        const bulkCourseScheduleOpResult = await CourseSchedule.bulkUpsertReplaceOne(bulkOperationScheduleItems, ['subject', 'catalog_number', 'class_number']);
        logger.verbose(`Successfully created ${bulkCourseScheduleOpResult.nUpserted} and modified ${bulkCourseScheduleOpResult.nModified} ` +
            `class sections on Course Schedule database`);
    } catch (err) {
        logger.error(`Failed to update Course Schedule model`);
        logger.error(err);
        throw Error(err);
    }

    try {
        const bulkCourseOpResult = await bulkOperationCourse.execute();
        logger.verbose(`Successfully modified ${bulkCourseOpResult.nModified} courses on database`);
    } catch (err) {
        logger.error(`Failed to update Course Schedule model`);
        logger.error(err);
        throw Error(err);
    }

    logger.info(`scrape_courses_schedule succeeded`);
};
