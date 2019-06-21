const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const CourseSchedule = require(`${approot}/models/CourseSchedule`);
const uwapi = require('../config/uwopendata_api');

/**
 * Update our course schedule with new enrollment changes from UW API
 *
 * First, request the enrollment for every section of every course for the current term.
 * Update the Course Schedule database.
 *
 * @returns {Promise<void>}
 */
module.exports = async () => {
    logger.info(`Starting ${TAG}`);

    let enrollmentList;
    let currentTermId; // the id of the current term

    {
        logger.verbose('Requesting current term id');
        currentTermId = (await uwapi.get('/terms/list', {})).data.current_term.toString();
        logger.verbose(`Current term id: ${currentTermId}`);
    }

    {
        logger.verbose('Requesting current term enrollment for every course');
        enrollmentList = (await uwapi.get(`/terms/${currentTermId}/enrollment`, {})).data;
        logger.verbose('Received class enrollment list');
    }

    {
        const bulkOp = CourseSchedule.collection.initializeUnorderedBulkOp();
        for (const item of enrollmentList) {
            bulkOp.find({
                subject: item.subject,
                catalog_number: item.catalog_number,
                class_number: item.class_number.toString(),
                term_id: currentTermId,
            }).updateOne({
                enrollment_capacity: item.enrollment_capacity,
                enrollment_total: item.enrollment_total,
                waiting_capacity: item.waiting_capacity,
                waiting_total: item.waiting_total,
                updated_at: new Date(item.last_updated),
            });
        }

        try {
            const bulkOpResult = await bulkOp.execute();
            logger.info(`Updated ${bulkOpResult.nModified} class schedules on Course Schedule database`);
        } catch (err) {
            logger.error(err);
            logger.error('Failed to update Course Schedule model');
            logger.warning(`${TAG} failed`);
            return;
        }
    }

    logger.info(`${TAG} finished`);
};
