const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const response = {};

    const username = req.params.username.toLowerCase();

    if (username === 'self') return next();

    if (username == null) {
        return next(new Error('Username cannot be null'));
    }

    let user;
    try {
        user = await User.findOne({username});
    } catch (err) {
        return next(err);
    }

    if (!user) {
        const newErr = new Error('User not found');
        newErr.status = 404;
        next(newErr);
        logger.info(`User ${username} not found`);
        return;
    }

    response.data = {
        name: user.name,
        username: user.username,
        avatar_url: user.avatar_url,
        favourite_courses: user.favourite_courses,
        terms: user.terms,
        created_at: user.created_at,
    };

    res.status(200).send(response);
};
