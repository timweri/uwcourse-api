const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        if (req.query.hasOwnProperty('favourite_courses')) {
            if (req.query.favourite_courses === 'true') {
                req.query.favourite_courses = true;
            } else if (req.query.favourite_courses === 'false') {
                req.query.favourite_courses = false;
            } else {
                return next(errorBuilder('Invalid parameter: favourite_courses', 400));
            }
        } else {
            req.query.favourite_courses = false;
        }

        next();
    } catch (err) {
        return next(err);
    }
};
