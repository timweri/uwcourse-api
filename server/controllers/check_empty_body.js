const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (req, res, next) => {
    if (!req.hasOwnProperty('body') || !req.body || Object.keys(req.body).length === 0) {
        const newErr = new Error();
        newErr.status = 400;
        next(newErr);
        logger.info('Empty request body');
        return;
    }
    next();
};
