const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);

module.exports = async (req, res, next) => {
    logger.setId(req.id);
    logger.info(`IP Address: ${req.ip}`);
    next();
};
