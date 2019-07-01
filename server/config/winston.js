const approot = require('app-root-path');
const winston = require('winston');

const options = {
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
    let uuid;
    if (label) {
        return {
            setId: (id) => {
                uuid = id;
            },
            error: (msg) => {
                if (uuid) logger.error(`[${label}] ${uuid}: ${msg}`);
                else logger.error(`[${label}] ${msg}`);
            },
            info: (msg) => {
                if (uuid) logger.info(`[${label}] ${uuid}: ${msg}`);
                else logger.info(`[${label}] ${msg}`);
            },
            debug: (msg) => {
                if (uuid) logger.debug(`[${label}] ${uuid}: ${msg}`);
                else logger.debug(`[${label}] ${msg}`);
            },
            verbose: (msg) => {
                if (uuid) logger.verbose(`[${label}] ${uuid}: ${msg}`);
                else logger.verbose(`[${label}] ${msg}`);
            },
            warn: (msg) => {
                if (uuid) logger.warn(`[${label}] ${uuid}: ${msg}`);
                else logger.warn(`[${label}] ${msg}`);
            },
        };
    } else {
        return logger;
    }
};
