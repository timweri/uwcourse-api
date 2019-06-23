module.exports = (logger, TAG) => (err, extraMessages) => {
    if (err) logger.error(err.stack);
    if (extraMessages) {
        for (const message of extraMessages) {
            logger.error(message);
        }
    }
    logger.error(`${TAG} failed`);
    return 1;
};
