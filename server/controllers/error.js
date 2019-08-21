const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (err, req, res, next) => {
    logger.setId(req.id);

    const result = {};
    let status;

    if (err.name === 'ValidationError') {
        for (const errorField in err.errors) {
            if (err.errors.hasOwnProperty(errorField)) {
                if (err.errors[errorField].path === 'token_key') {
                    logger.error(err.stack);
                    status = 500;
                    result.error = 'SERVER_ERROR';
                } else {
                    logger.info(err.toString());
                    status = 400;
                    result.error = err.errors[errorField].message;
                }
                break;
            }
        }
    } else if (err.status) {
        status = err.status;
        if (err.message && err.message !== '') {
            result.error = err.message;
        } else switch (err.status) {
            case 400:
                result.error = 'BAD_REQUEST';
                break;
            case 401:
                result.error = 'UNAUTHORIZED';
                break;
            case 404:
                result.error = 'NOT_FOUND';
                break;
            case 409:
                result.error = 'CONFLICT';
                break;
            case 500:
                logger.error(err.stack);
                result.error = 'SERVER_ERROR';
                break;
            default:
                result.error = '';
        }
    } else {
        logger.error(err.stack);
        status = 500;
        result.error = 'SERVER_ERROR';
    }
    logger.info(`Returned ${status} with body ${JSON.stringify(result)}`);
    res.status(status).send(result);
};
