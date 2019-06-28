const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const CourseSchedule = require(`${approot}/models/CourseSchedule`);
const uwapi = require('../config/uwopendata_api');
const fail = require('./utils/fail_task')(logger, TAG);
const getCurrentTermId = require('./utils/current_term_id')(logger, TAG);

/**
 * Update our course schedule with new enrollment changes from UW API
 *
 * First, request the enrollment for every section of every course for the current term.
 * Update the Course Schedule database.
 *
 * @returns {Promise<int>}
 */
module.exports = async () => {
    logger.info(`Starting ${TAG}`);

    let enrollmentList;
    let currentTermId; // the id of the current term

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

    {
        const bulkOps = [];
        for (const item of enrollmentList) {
            bulkOps.push({
                updateOne: {
                    filter: {
                        subject: item.subject,
                        catalog_number: item.catalog_number,
                        class_number: item.class_number.toString(),
                        term_id: currentTermId.internal_id,
                    },
                    update: {
                        $set: {
                            enrollment_capacity: item.enrollment_capacity,
                            enrollment_total: item.enrollment_total,
                            waiting_capacity: item.waiting_capacity,
                            waiting_total: item.waiting_total,
                            updated_at: new Date(item.last_updated),
                        },
                    },
                    upsert: false,
                },
            });
        }

        try {
            const bulkOpResult = await CourseSchedule.collection.bulkWrite(bulkOps, {ordered: false});
            logger.info(`Updated ${bulkOpResult.nModified} class schedules on Course Schedule database`);
        } catch (err) {
            return fail(err);
        }
    }

    logger.info(`${TAG} finished`);
    return 0;
};
