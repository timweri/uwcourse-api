const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const response = {};

    const user = req.user;

    logger.info(`Received GET request to fetch ${user.username}'s profile`);

    response.data = {
        name: user.name,
        username: user.username,
        avatar_url: user.avatar_url,
        favourite_courses: user.favourite_courses,
        terms: user.terms,
        updated_at: user.updated_at,
        created_at: user.created_at,
        last_login_at: user.last_login_at,
    };

    res.status(200).send(response);
    logger.info(`GET request for ${user.username} succeeded`);
};
