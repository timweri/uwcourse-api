const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const Course = require(`${approot}/models/Course`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const id = req.params.id;
        const like_dislike = req.body.like_dislike;

        if (isNaN(like_dislike)) {
            return next(buildErrorResponse('LIKE_DISLIKE_VALUE_REQUIRED'), 400);
        }

        const course = await Course.findById(id);
        if (!course) {
            return next(buildErrorResponse('COURSE_NOT_FOUND', 404));
        }

        let found = false;
        for (let i = 0; i < req.token.user.like_dislike.length; ++i) {
            const item = req.token.user.like_dislike[i];
            if (item.course_id.toString() === id) {
                found = true;
                if (item.value === like_dislike) break;
                if (item.value === 1 && like_dislike === 0) {
                    await course.updateOne({
                        $inc: {
                            'liked_rating.value': -1,
                            'liked_rating.count': -1,
                        },
                    });
                    req.token.user.like_dislike.splice(i, 1);
                } else if (item.value === 1 && like_dislike === -1) {
                    await course.updateOne({
                        $inc: {
                            'liked_rating.value': -1,
                        },
                    });
                    item.value = like_dislike;
                } else if (item.value === -1 && like_dislike === 0) {
                    await course.updateOne({
                        $inc: {
                            'liked_rating.count': -1,
                        },
                    });
                    req.token.user.like_dislike.splice(i, 1);
                } else if (item.value === -1 && like_dislike === 1) {
                    await course.updateOne({
                        $inc: {
                            'liked_rating.value': 1,
                        },
                    });
                    item.value = like_dislike;
                }

                await req.token.user.save();
                break;
            }
        }
        if (!found && like_dislike !== 0) {
            if (like_dislike === 1) {
                await course.updateOne({
                    $inc: {
                        'liked_rating.value': 1,
                        'liked_rating.count': 1,
                    },
                });
            }
            if (like_dislike === -1) {
                await course.updateOne({
                    $inc: {
                        'liked_rating.count': 1,
                    },
                });
            }
            req.token.user.like_dislike.push({
                course_id: id,
                value: like_dislike,
            });
            await req.token.user.save();
        }

        logger.info('Returning 204');
        res.sendStatus(204);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_COURSE_ID', 400));
        }
        next(err);
    }
};
