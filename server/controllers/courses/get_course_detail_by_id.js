const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const CourseDetail = require(`${approot}/models/CourseDetail`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const id = req.params.id;

        const courseDetail = await CourseDetail.findById(id);
        if (!courseDetail) {
            return next(buildErrorResponse('COURSE_DETAIL_NOT_FOUND', 404));
        }

        const response = {
            data: courseDetail.toJSON(),
        };

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
