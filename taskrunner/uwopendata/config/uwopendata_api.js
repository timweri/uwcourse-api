const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const config = require(`${approot}/config/config`);
const rp = require('request-promise-native');
const logger = require(`${approot}/config/winston`)(TAG);
const timeout = require(`${approot}/utils/delay`);

const filterResponseCourse = (response) => {
    response.data = response.data.filter(entry => !entry.catalog_number.includes('`'));
    return response;
};

/**
 * Filter out known incorrect entries returned by UW API
 *
 * @param response - response from query to API
 * @param endpoint - the endpoint queried
 * @returns {*} - the response with the incorrect entries removed
 */
const filterResponse = (response, endpoint) => {
    const fnMap = {
        '/courses': filterResponseCourse,
    };
    if (fnMap.hasOwnProperty(endpoint)) {
        const new_response = fnMap[endpoint](response);
        logger.verbose(`Filtered out ${response.data.length - new_response.data.length} items from endpoint ${endpoint}`);
        return new_response;
    } else
        return response;
};

const get = async (resource, qs) => {
    const options = {
        method: 'GET',
        uri: `${config.uwopendata.api_uri}${resource}.json`,
        qs: Object.assign({
            key: config.uwopendata.api_key,
        }, qs),
        json: true,
    };
    let delay = config.uwopendata.retry_delay;
    let response;
    for (let i = 0; i < config.uwopendata.retries; ++i) {
        try {
            logger.verbose(`Sending GET request to ${options.uri}`);
            response = filterResponse(await rp(options), resource, qs);
            if (response != null) break;
        } catch (error) {
            logger.error(`GET request failed at ${options.uri} with ${error}`);
            if (i >= config.uwopendata.retries - 1) throw error;
            else {
                logger.warn(`Retrying GET request at ${options.uri}`);
                await timeout(delay);
                delay *= config.uwopendata.retry_delay_multiplier;
            }
        }
    }
    const responseCode = response.meta.status;
    if (responseCode === 200 || responseCode === 204) {
        logger.verbose(`GET request to ${options.uri} succeeded with code ${responseCode}`);
        return response;
    } else {
        logger.error(`GET request to ${options.uri} failed with code ${responseCode}`);
        logger.error(JSON.stringify(response));
        throw Error(response);
    }
};

exports.get = get;
