const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const Course = require(`${approot}/models/Course`);
const CourseDetail = require(`${approot}/models/CourseDetail`);
const Term = require(`${approot}/models/Term`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const id = req.params.id;
        const populate = typeof req.query.populate === 'string' ? req.query.populate.split(',') : null;
        const optional_fields = typeof req.query.optional_fields === 'string' ? req.query.optional_fields.split(',') : null;

        const course = await Course.findById(id);
        if (!course) {
            return next(buildErrorResponse('COURSE_NOT_FOUND', 404));
        }

        const response = {
            data: course.toObject(),
        };

        if (Array.isArray(populate)) {
            if (populate.includes('latest_term')) {
                response.data.latest_term = await Term.populate(course, {path: 'latest_term'});
            }
            if (populate.includes('latest_detail')) {
                response.data.latest_detail = await CourseDetail.populate(course, {path: 'latest_detail'});
            }
        }

        if (Array.isArray(optional_fields)) {
            if (req.token && optional_fields.includes('like_dislike')) {
                console.log('here');
                response.data.like_dislike = 0;
                for (const likeDislike of req.token.user.like_dislike) {
                    if (likeDislike.course_id.toString() === id) {
                        response.data.like_dislike = likeDislike.value;
                        break;
                    }
                }
            }
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
