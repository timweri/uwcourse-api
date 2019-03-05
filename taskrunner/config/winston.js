const appRoot = require('app-root-path');
const winston = require('winston');

var options = {
    file: {
        level: 'info',
        filename: `${appRoot}/logs/info.log`,
        handleExceptions: true,
        json: true,
        timestamp: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console)
    ],
    exitOnError: false, // do not exit on handled exceptions
});

module.exports = (label) => {
    if (label) {
        return {
            error: (msg) => {
                logger.error(`[${label}] ${msg}`);
            },
            info: (msg) => {
                logger.info(`[${label}] ${msg}`);
            },
            debug: (msg) => {
                logger.debug(`[${label}] ${msg}`);
            },
            verbose: (msg) => {
                logger.verbose(`[${label}] ${msg}`);
            },
        };
    }
    else {
        return logger;
    }
};
