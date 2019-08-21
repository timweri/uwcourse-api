const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const Course = require(`${approot}/models/Course`);
const CourseReview = require(`${approot}/models/CourseReview`);
const Term = require(`${approot}/models/Term`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const id = req.params.id;
        const {term_id, easy_rating, useful_rating, content} = req.body;

        if (!term_id) {
            return next(buildErrorResponse('TERM_ID_REQUIRED', 400));
        }

        const term = await Term.findById(term_id);
        if (!term) {
            return next(buildErrorResponse('TERM_NOT_FOUND', 404));
        }

        if (!easy_rating) {
            return next(buildErrorResponse('EASY_RATING_REQUIRED', 400));
        }

        if (!useful_rating) {
            return next(buildErrorResponse('USEFUL_RATING_REQUIRED', 400));
        }

        if (typeof content === 'undefined') {
            return next(buildErrorResponse('CONTENT_REQUIRED', 400));
        }

        const course = await Course.findById(id);
        if (!course) {
            return next(buildErrorResponse('COURSE_NOT_FOUND', 404));
        }

        let courseReview = await CourseReview.findOne({course_id: id, user_id: req.token.user._id});
        if (courseReview) {
            return next(buildErrorResponse('REVIEW_EXISTS', 409));
        }

        const newDate = new Date();
        courseReview = new CourseReview({
            term_id,
            course_id: id,
            user_id: req.token.user._id,
            easy_rating,
            useful_rating,
            content,
            updated_at: newDate,
            created_at: newDate,
        });

        await courseReview.save();

        logger.info('Returning 204');
        res.sendStatus(204);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_OBJECT_ID', 400));
        }
        next(err);
    }
};
