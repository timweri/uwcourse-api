const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const CourseSchedule = require(`${approot}/models/CourseSchedule`);
const uwapi = require('../config/uwopendata_api');
const timeout = require(`${approot}/utils/delay`);

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
    let currentTermId; // the id of the current term

    // Read the list of courses created by scrape_courses
    // Terminates if the list is not found
    try {
        listCourses = JSON.parse(await fs.promises.readFile(options.listCoursesArchivePath, options.archiveEncoding));
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.error(`${options.listCoursesArchivePath} does not exist`);
            logger.warning(`${TAG} failed`);
            return;
        } else throw Error(err);
    }

    {
        logger.verbose(`Requesting current term id`);
        currentTermId = (await uwapi.get(`/terms/list`, {})).data.current_term.toString();
        logger.verbose(`Current term id: ${currentTermId}`);
    }

    let queue = []; // a queue of HTTP request, each item is for one course

    for (const e of listCourses) {
        queue.push({endpoint: `/courses/${e.subject}/${e.catalog_number}/schedule`, qs: {}});
    }

    let nSuccessfuleScheduleQuery = 0;
    let nScheduleModified = 0;
    let nScheduleUpserted = 0;
    let bulkOperationScheduleItems = [];

    const requestInBatch = async () => {
        while (queue.length > 0) {
            // Get the schedule in batches
            let batchResult = await Promise.all(queue.slice(0, options.batchSize)
                .map((e) => uwapi.get(e.endpoint, e.qs)));
            queue = queue.slice(options.batchSize);
            await timeout(options.batchDelay);

            nSuccessfuleScheduleQuery += batchResult.length;
            let bulkCourseScheduleOp = CourseSchedule.collection.initializeUnorderedBulkOp();

            // For each course
            for (let courseItem of batchResult) {
                if (courseItem.meta.status === 204) continue;
                let courseItemData = courseItem.data;
                for (let section of courseItemData) {
                    section.class_number = section.class_number.toString();
                    bulkOperationScheduleItems.push({
                        subject: section.subject,
                        catalog_number: section.catalog_number,
                        class_number: section.class_number,
                    });
                    bulkCourseScheduleOp.find({
                        subject: section.subject,
                        catalog_number: section.catalog_number,
                        term_id: currentTermId,
                        class_number: section.class_number,
                    }).upsert().updateOne({
                        $set: {
                            campus: section.campus,
                            note: section.note,
                            enrollment_capacity: section.enrollment_capacity,
                            enrollment_total: section.enrollment_total,
                            waiting_capacity: section.waiting_capacity,
                            waiting_total: section.waiting_total,
                            reserves: section.reserves,
                            classes: section.classes,
                            section: section.section,
                            updated_at: new Date(section.last_updated),
                        },
                        $setOnInsert: {
                            subject: section.subject,
                            catalog_number: section.catalog_number,
                            term_id: currentTermId,
                            class_number: section.class_number,
                        },
                    });
                }
            }

            try {
                const bulkOpResult = await bulkCourseScheduleOp.execute();
                nScheduleModified += bulkOpResult.nModified;
                nScheduleUpserted += bulkOpResult.nUpserted;
            } catch (err) {
                logger.error(err);
                logger.error(`Failed to update Course Schedule database`);
                throw err;
            }
        }
    };

    try {
        await requestInBatch();
        logger.verbose(`Processed schedules of ${nSuccessfuleScheduleQuery}/${listCourses.length} courses`);
        logger.verbose(`Created ${nScheduleUpserted} and modified ${nScheduleModified} ` +
            `class sections on Course Schedule database`);
    } catch (error) {
        logger.error(error);
        logger.error(`Failed to process schedules of ${listCourses.length} courses`);
        logger.warning(`${TAG} failed`);
        return;
    }

    try {
        let scheduleFindConditions = [];
        for (const item of bulkOperationScheduleItems) {
            scheduleFindConditions.push({
                $and: [{
                    subject: item.subject,
                    catalog_number: item.catalog_number,
                    term_id: currentTermId,
                    class_number: item.class_number,
                }],
            });
        }
        bulkOperationScheduleItems = null;
        const scheduleFindResult = await CourseSchedule.find({$or: scheduleFindConditions}, ['_id', 'subject', 'catalog_number']);
        scheduleFindConditions = null;
        let courseBulkOperation = Course.collection.initializeUnorderedBulkOp();
        for (const item of scheduleFindResult) {
            courseBulkOperation.find({
                subject: item.subject,
                catalog_number: item.catalog_number,
                term_id: currentTermId,
                schedule: {$ne: item._id},
            }).updateOne({
                $addToSet: {
                    schedule: item._id,
                },
                $set: {updated_at: new Date()},
            });
        }
        const bulkCourseOpResult = await courseBulkOperation.execute();
        logger.verbose(`Successfully added ${bulkCourseOpResult.nModified} schedules on Course database`);
    } catch (err) {
        logger.error(err);
        logger.error(`Failed to update Course Schedule model`);
        logger.warning(`${TAG} failed`);
        throw Error(err);
    }

    logger.info(`${TAG} finished`);
};
