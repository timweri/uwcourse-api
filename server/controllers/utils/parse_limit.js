const approot = require('app-root-path');
const config = require(`${approot}/config/config`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = (limit) => {
    if (limit) {
        limit = parseInt(limit);
        if (!Number.isInteger(limit) || limit < 0) {
            throw buildErrorResponse('INVALID_LIMIT', 400);
        }
    } else limit = config.default_pagination_limit;
    return limit;
};
