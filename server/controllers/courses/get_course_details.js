const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const config = require(`${approot}/config/config`);
const CourseDetail = require(`${approot}/models/CourseDetail`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);
const parseComparisonOpt = require(`${approot}/controllers/utils/parse_comparison_opt`);
const parseLimit = require(`${approot}/controllers/utils/parse_limit`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const {course_id, term_id, cursor} = req.query;
        let limit = req.query.limit;

        limit = parseLimit(limit);

        const queryObj = {
            course_id,
        };

        if (cursor) {
            queryObj._id = {$lt: cursor};
        }

        parseComparisonOpt(term_id, 'term_id', queryObj);

        const courseDetails = await CourseDetail.find(queryObj).sort({_id: -1}).limit(limit);
        const response = {
            data: courseDetails,
        };

        if (courseDetails.length > 0) {
            response.cursor = courseDetails[courseDetails.length - 1]._id;
        }

        logger.info('Returning 200');
        res.status(200)
            .send(response);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_OBJECT_ID', 400));
        }
        next(err);
    }
};
