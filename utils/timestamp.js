/*
This module contains tools to help generate and validate timestamp in the correct format
The format we use is ISO 8601 Datetime with time zone: 2008-09-15T15:53:00+05:00
The timezone we use is defined in config/config.js as an offset to UTC
 */

const approot = require('app-root-path');
const { TIME_ZONE_OFFSET } = require(`${approot}/config/config`);

const TIMESTAMP_EXPRESSION = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

exports.TIMESTAMP_EXPRESSION = TIMESTAMP_EXPRESSION;

/**
 * Timestamp format predicate
 * @param timestamp
 * @returns {boolean}
 */
exports.validateTimestamp = (timestamp) => TIMESTAMP_EXPRESSION.test(timestamp);


/**
 * Generate timestamp of ISO 8601 for current time in the configured timezone
 */
exports.generateTimestamp = () => {
    let date = new Date();
    date.setTime(date.getTime() + TIME_ZONE_OFFSET * 60 * 60 * 1000);
    return `${date.getUTCFullYear()}-` +
        `${(date.getUTCMonth()+1).toString().padStart(2,'0')}-` +
        `${date.getUTCDate().toString().padStart(2,'0')}` +
        `T${date.getUTCHours().toString().padStart(2,'0')}:` +
        `${date.getUTCMinutes().toString().padStart(2,'0')}:` +
        `${date.getUTCSeconds().toString().padStart(2,'0')}` +
        `${TIME_ZONE_OFFSET < 0 ? '-' : '+'}` +
        `${Math.floor(Math.abs(TIME_ZONE_OFFSET)).toString().padStart(2,'0')}:` +
        `${Math.floor(((TIME_ZONE_OFFSET % 1)* 60)).toString().padStart(2, '0')}`;
};
