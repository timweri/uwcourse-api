const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const response = {};

        const username = req.params.username.toLowerCase();

        if (username === 'self') return next();

        if (username == null) {
            return next(errorBuilder('Username cannot be null', 400));
        }

        const user = await User.findOne({username});

        if (!user) {
            logger.info(`User ${username} not found`);
            return next(errorBuilder('User not found', 404));
        }

        response.data = {
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            favourite_courses: user.favourite_courses,
            terms: user.terms,
            created_at: user.created_at,
        };

        res.status(200)
            .send(response);
    } catch (err) {
        return next(err);
    }
};
