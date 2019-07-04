const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (err, req, res, next) => {
    logger.setId(req.id);

    const result = {};

    if (err.name === 'ValidationError') {
        for (const errorField in err.errors) {
            if (err.errors.hasOwnProperty(errorField)) {
                if (err.errors[errorField].path === 'token_key') {
                    logger.error(err.stack);
                    result.status = 500;
                    result.error = '500 Server error';
                } else {
                    logger.info(err.toString());
                    result.status = 400;
                    result.error = err.errors[errorField].message;
                }
                break;
            }
        }
    } else if (err.status) {
        result.status = err.status;
        if (err.message && err.message !== '') {
            result.error = err.message;
        } else switch (err.status) {
            case 400:
                result.error = '400 Bad request';
                break;
            case 401:
                result.error = '401 Unauthorized';
                break;
            case 404:
                result.error = '404 Not found';
                break;
            case 500:
                logger.error(err.stack);
                result.error = '500 Server error';
                break;
            default:
                result.error = '';
        }
    } else {
        logger.error(err.stack);
        result.status = 500;
        result.error = '500 Server error';
    }
    res.status(result.status).send(result.error);
};
