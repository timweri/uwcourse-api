const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const uwapi = require('../config/uwopendata_api');
const fail = require('./utils/fail_task')(logger, TAG);
const CourseDetail = require(`${approot}/models/CourseDetail`);
const Course = require(`${approot}/models/Course`);
const getCurrentTermId = require('./utils/current_term_id')(logger, TAG);

module.exports = async () => {
    logger.info(`Starting ${TAG}`);

    let enrollmentList;
    let currentTermId;

    try {
        currentTermId = await getCurrentTermId();
    } catch (err) {
        return fail(err);
    }

    {
        logger.verbose('Requesting current term enrollment for every course');
        enrollmentList = (await uwapi.get(`/terms/${currentTermId.uw_id}/enrollment`, {})).data;
        logger.verbose('Received class enrollment list');
    }

    const subjectCatalogToCourseIdMap = new Map();

    {
        const latestCourses = await Course.find({latest_term: currentTermId.internal_id});
        for (const course of latestCourses) {
            subjectCatalogToCourseIdMap.set({
                subject: course.subject,
                catalog_number: course.catalog_number,
            }, course._id);
        }
    }

    {
        const bulkOps = [];
        for (const item of enrollmentList) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        course_id: subjectCatalogToCourseIdMap.get({subject: item.subject, catalog_number: item.catalog_number}),
                        term_id: currentTermId.internal_id,
                    },
                    update: {
                        $set: {
                            'schedule.$[element]': {
                                class_number: item.class_number,
                                enrollment_capacity: item.enrollment_capacity,
                                enrollment_total: item.enrollment_total,
                                waiting_capacity: item.waiting_capacity,
                                waiting_total: item.waiting_total,
                                last_updated: new Date(item.last_updated),
                                updated_at: new Date(),
                            },
                        },
                    },
                    arrayFilters: [{
                        'element.class_number': item.class_number,
                    }],
                    upsert: false,
                },
            });
        }

        try {
            const bulkOpResult = await CourseDetail.collection.bulkWrite(bulkOps, {ordered: false});
            logger.info(`Updated ${bulkOpResult.nModified} class schedules on Course Detail database`);
        } catch (err) {
            return fail(err);
        }
    }

    logger.info(`${TAG} finished`);
    return 0;
};
