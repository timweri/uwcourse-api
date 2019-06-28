const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (req, res, next) => {
    if (!req.hasOwnProperty('body') || !req.body) {
        const newErr = new Error();
        newErr.status = 400;
        next(newErr);
        logger.info('Empty request body');
        return;
    }
    next();
};
