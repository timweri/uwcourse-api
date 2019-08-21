const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const Course = require(`${approot}/models/Course`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const id = req.params.id;

        if (id === 'self') {
            return next();
        }

        const populate = typeof req.query.populate === 'string' ? req.query.populate.split(',') : null;

        const user = await User.findById(id);
        if (!user) {
            return next(buildErrorResponse('USER_NOT_FOUND', 404));
        }

        const response = {
            data: {
                id: user._id,
                name: user.name,
                username: user.username,
                faculty: user.faculty,
                program: user.program,
                avatar_url: user.avatar_url,
                bookmark_courses: user.bookmark_courses,
                taken_courses: user.taken_courses,
                last_login_at: user.last_login_at,
                updated_at: user.updated_at,
                created_at: user.created_at,
            },
        };

        if (Array.isArray(populate)) {
            if (populate.includes('bookmark_courses')) {
                response.data.bookmark_courses = await Course.populate(user, {path: 'bookmark_courses'});
            }
            if (populate.includes('taken_courses')) {
                response.data.taken_courses = await user.populateTakenCourses();
            }
        }

        logger.info('Returning 200');
        res.status(200)
            .send(response);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_USER_ID', 400));
        }
        next(err);
    }
};
