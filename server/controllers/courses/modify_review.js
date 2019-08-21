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

        const courseReview = await CourseReview.findOne({course_id: id, user_id: req.token.user._id});
        if (!courseReview) {
            return next(buildErrorResponse('COURSE_REVIEW_NOT_FOUND', 404));
        }

        if (term_id) {
            const term = await Term.findById(term_id);
            if (!term) {
                return next(buildErrorResponse('TERM_NOT_FOUND', 404));
            }
            courseReview.term_id = term_id;
        }

        if (easy_rating) {
            courseReview.easy_rating = easy_rating;
        }

        if (useful_rating) {
            courseReview.useful_rating = useful_rating;
        }

        if (typeof content !== 'undefined') {
            courseReview.content = content;
        }

        if (courseReview.isModified()) {
            courseReview.updated_at = new Date();
            await courseReview.save();
        }

        logger.info('Returning 204');
        res.sendStatus(204);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_OBJECT_ID', 400));
        }
        next(err);
    }
};
