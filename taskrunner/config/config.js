const env = process.env.NODE_ENV;

// TIMEZONE_OFFSET is defined as a UTC offset
// The timezone would be UTC+<TIMEZONE_OFFSET>
const TIMEZONE_OFFSET = -5; // EST

/**
 * UWOpenData Connector Configurations
 */

const UWOPENDATA_API_URI = 'https://api.uwaterloo.ca/v2';
const UWOPENDATA_API_KEY = process.env.UWOPENDATA_API_KEY;
const UWOPENDATA_RETRIES = 5;
const UWOPENDATA_RETRY_DELAY = 500;
const UWOPENDATA_RETRY_DELAY_MULTIPLIER = 2;

/////////////////////////////////////////////

const dev = {
    db: {
        host: process.env.DEV_DB_HOST || 'mongodb://mongodb',
        port: parseInt(process.env.DEV_DB_PORT) || 27017,
        name: process.env.DEV_DB_NAME || 'uwcourseapi',
    },
    timezone: TIMEZONE_OFFSET,
    uwopendata: {
        api_uri: UWOPENDATA_API_URI,
        api_key: UWOPENDATA_API_KEY,
        retry_delay: UWOPENDATA_RETRY_DELAY,
        retries: UWOPENDATA_RETRIES,
        retry_delay_multipier: UWOPENDATA_RETRY_DELAY_MULTIPLIER,
    },
};

const test = {
    db: {
        host: process.env.TEST_DB_HOST || 'mongodb://mongodb',
        port: parseInt(process.env.TEST_DB_PORT) || 27017,
        name: process.env.TEST_DB_NAME || 'test',
    },
    timezone: TIMEZONE_OFFSET,
    uwopendata: {
        api_uri: UWOPENDATA_API_URI,
        api_key: UWOPENDATA_API_KEY,
        retry_delay: UWOPENDATA_RETRY_DELAY,
        retries: UWOPENDATA_RETRIES,
        retry_delay_multipier: UWOPENDATA_RETRY_DELAY_MULTIPLIER,
    },
};

const config = {
    dev,
    test,
};

module.exports = config[env];