const approot = require('app-root-path');
const winston = require('winston');

let options = {
    file: {
        level: 'info',
        filename: `${approot}/logs/info.log`,
        handleExceptions: true,
        format: winston.format.json(),
        timestamp: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        format: winston.format.simple(),
        colorize: true,
    },
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.File(options.file),
    ],
    exitOnError: false, // do not exit on handled exceptions
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console(options.console));
}

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
            warn: (msg) => {
                logger.warn(`[${label}] ${msg}`);
            },
        };
    }
    else {
        return logger;
    }
};
