const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const response = {};

        const user = req.user;

        logger.info(`Received GET request to fetch ${user.username}'s profile`);

        response.data = {
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            terms: user.terms,
            updated_at: user.updated_at,
            created_at: user.created_at,
            last_login_at: user.last_login_at,
        };

        if (req.query.favourite_courses) {
            await user.populate('favourite_courses', ['title', 'subject', 'catalog_number', 'rating'])
                .execPopulate();
            response.data.favourite_courses = user.favourite_courses;
        }

        res.status(200)
            .send(response);
        logger.info(`GET request for ${user.username} succeeded`);
    } catch (err) {
        return next(err);
    }
};
