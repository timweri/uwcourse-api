const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const result = {};

    const user = req.user;

    logger.info(`Received GET request to fetch ${user.email}'s profile`);

    result.status = 200;
    result.data = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        favourite_courses: user.favourite_courses,
        terms: user.terms,
        updated_at: user.updated_at,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
    };

    res.status(result.status).send(result);
    logger.info(`GET request for ${user.email} succeeded`);
};
