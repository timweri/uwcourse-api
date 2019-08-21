const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const fs = require('fs');
const Course = require(`${approot}/models/Course`);
const CourseDetail = require(`${approot}/models/CourseDetail`);
const uwapi = require('../config/uwopendata_api');
const timeout = require(`${approot}/utils/delay`);
const fail = require('./utils/fail_task')(logger, TAG);
const getCurrentTermId = require('./utils/current_term_id')(logger, TAG);

module.exports = async (options) => {
    logger.info(`Starting ${TAG}`);

    options = Object.assign({
        listCoursesArchivePath: `${approot}/uwopendata/data/courses_array.json`,
        archiveEncoding: 'utf8',
        batchSize: 300,
        batchDelay: 500,
    }, options);

    let listCourses = []; // list of courses by course_id
    let currentTermId; // the id of the current term

    // Read the list of courses created by scrape_courses
    // Terminates if the list is not found
    try {
        listCourses = JSON.parse(await fs.promises.readFile(options.listCoursesArchivePath, options.archiveEncoding));
    } catch (err) {
        if (err.code === 'ENOENT') {
            return fail(err, [`${options.listCoursesArchivePath} does not exist`]);
        } else return fail(err);
    }

    try {
        currentTermId = await getCurrentTermId();
    } catch (err) {
        return fail(err);
    }

    let queue = []; // a queue of HTTP request, each item is for one course

    for (const e of listCourses) {
        queue.push({
            endpoint: `/courses/${e.subject}/${e.catalog_number}/schedule`,
            qs: {},
            subject: e.subject,
            catalog_number: e.catalog_number,
            uw_course_id: e.course_id,
        });
    }

    let nSuccessfulScheduleQuery = 0;
    let nScheduleModified = 0;
    let nScheduleUpserted = 0;

    const requestInBatch = async () => {
        while (queue.length > 0) {
            // Get the schedule in batches
            const batchResult = await Promise.all(queue.slice(0, options.batchSize)
                .map(async (e) => {
                    const result = await uwapi.get(e.endpoint, e.qs);
                    result.subject = e.subject;
                    result.catalog_number = e.catalog_number;
                    result.uw_course_id = e.uw_course_id;
                    return result;
                }));
            queue = queue.slice(options.batchSize);
            await timeout(options.batchDelay);

            nSuccessfulScheduleQuery += batchResult.length;
            const bulkCourseDetailOps = [];

            // For each course
            for (const courseItem of batchResult) {
                if (courseItem.meta.status === 204) continue;
                const courseItemData = courseItem.data;
                const currentCourseInDatabase = await Course.findOne({
                    subject: courseItem.subject,
                    catalog_number: courseItem.catalog_number,
                    uw_course_id: courseItem.uw_course_id,
                });
                const currentCourseDetailInDatabase = await CourseDetail.findOne({
                    course_id: currentCourseInDatabase._id,
                    term_id: currentTermId.internal_id,
                });
                for (const section of courseItemData) {
                    section.class_number = section.class_number.toString();
                    section.last_updated = new Date(section.last_updated);
                    bulkCourseDetailOps.push({
                        updateOne: {
                            filter: {
                                _id: currentCourseDetailInDatabase._id,
                            },
                            update: {
                                $set: {
                                    'schedule.$[element]': {
                                        class_number: section.class_number,
                                        campus: section.campus,
                                        note: section.note,
                                        enrollment_capacity: section.enrollment_capacity,
                                        enrollment_total: section.enrollment_total,
                                        waiting_capacity: section.waiting_capacity,
                                        waiting_total: section.waiting_total,
                                        reserves: section.reserves,
                                        classes: section.classes,
                                        section: section.section,
                                        last_updated: new Date(section.last_updated),
                                        updated_at: new Date(),
                                    },
                                },
                            },
                            arrayFilters: [{
                                'element.class_number': section.class_number,
                            }],
                            upsert: true,
                        },
                    });
                    bulkCourseDetailOps.push({
                        updateOne: {
                            filter: {
                                _id: currentCourseDetailInDatabase._id,
                                schedule: {
                                    $not: {
                                        $elemMatch: {
                                            class_number: section.class_number,
                                        },
                                    },
                                },
                            },
                            update: {
                                $push: {
                                    schedule: {
                                        class_number: section.class_number,
                                        campus: section.campus,
                                        note: section.note,
                                        enrollment_capacity: section.enrollment_capacity,
                                        enrollment_total: section.enrollment_total,
                                        waiting_capacity: section.waiting_capacity,
                                        waiting_total: section.waiting_total,
                                        reserves: section.reserves,
                                        classes: section.classes,
                                        section: section.section,
                                        last_updated: section.last_updated,
                                        updated_at: new Date(),
                                    },
                                },
                            },
                        },
                    });
                }
            }

            try {
                const bulkOpResult = await CourseDetail.collection.bulkWrite(bulkCourseDetailOps, {ordered: true});
                nScheduleModified += bulkOpResult.modifiedCount;
                nScheduleUpserted += bulkOpResult.upsertedCount;
            } catch (err) {
                return fail(err, ['Failed to update Course Schedule database']);
            }
        }
    };

    try {
        await requestInBatch();
        logger.verbose(`Processed schedules of ${nSuccessfulScheduleQuery}/${listCourses.length} courses`);
        logger.info(`Created ${nScheduleUpserted} and modified ${nScheduleModified} ` +
            'class sections on Course Detail database');
    } catch (err) {
        return fail(err, [`Failed to process schedules of ${listCourses.length} courses`]);
    }

    logger.info(`${TAG} finished`);
    return 0;
};
