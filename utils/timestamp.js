/*
This module contains tools to help generate and validate timestamp in the correct format
The format we use is ISO 8601 Datetime with time zone: 2008-09-15T15:53:00+05:00
The timezone we use is defined in config/config.js as an offset to UTC
 */

const approot = require('app-root-path');
const { TIMEZONE_OFFSET } = require(`${approot}/config/config`);

/**
 * Matching group index and their meaning:
 * 1: year
 * 2: month
 * 3: day
 * 4: hour
 * 5: minute
 * 6: second
 * 7: timezone
 *
 * @type {RegExp}
 */
const TIMESTAMP_EXPRESSION = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2}|Z)$/;

exports.TIMESTAMP_EXPRESSION = TIMESTAMP_EXPRESSION;

/**
 * Parse a timezone string to a float offset
 */
const parseTimezone = (timezone) => {
    if (typeof timezone == "number")
        return timezone;
    if (timezone === 'Z') return 0;
    else {
        let match = /^([-+])(\d{2}):(\d{2})$/.exec(timezone);
        let result = parseFloat(match[2]);
        result += parseInt(match[3], 10) / 60;
        if (match[1] === '-') result *= -1;
        return result;
    }
};

exports.parseTimezone = parseTimezone;

/**
 * Timestamp format predicate
 * @param timestamp
 * @returns {boolean}
 */
exports.validateTimestamp = (timestamp) => TIMESTAMP_EXPRESSION.test(timestamp);


/**
 * Generate timestamp of ISO 8601 for current time in the configured timezone
 */
const dateToString = (date) => {
    date.setTime(date.getTime() + TIMEZONE_OFFSET * 60 * 60 * 1000);
    return `${date.getUTCFullYear()}-` +
        `${(date.getUTCMonth()+1).toString().padStart(2,'0')}-` +
        `${date.getUTCDate().toString().padStart(2,'0')}` +
        `T${date.getUTCHours().toString().padStart(2,'0')}:` +
        `${date.getUTCMinutes().toString().padStart(2,'0')}:` +
        `${date.getUTCSeconds().toString().padStart(2,'0')}` +
        (TIMEZONE_OFFSET === 0 ? 'Z' :
            `${TIMEZONE_OFFSET < 0 ? '-' : '+'}` +
            `${Math.floor(Math.abs(TIMEZONE_OFFSET)).toString().padStart(2,'0')}:` +
            `${Math.floor(((TIMEZONE_OFFSET % 1)* 60)).toString().padStart(2, '0')}`);
};

exports.generateTimestampString = () => {
    let date = new Date();
    return dateToString(date);
};

/**
 * Parse a timestamp of ISO 8601
 */
const parseTimestamp = (timestamp) => {
    let match = TIMESTAMP_EXPRESSION.exec(timestamp);
    return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
        hour: Number(match[4]),
        minute: Number(match[5]),
        second: Number(match[6]),
        timezone: match[7],
    };
};

exports.parseTimestamp = parseTimestamp;

/**
 * Convert a given timestamp to timestamp of current timezone
 */
const convertTimezone = (timestamp) => {
    return dateToString(new Date(timestamp));
};

exports.convertTimezone = convertTimezone;
