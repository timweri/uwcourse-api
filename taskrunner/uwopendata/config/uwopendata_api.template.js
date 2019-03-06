const approot = require('app-root-path');
const rp = require('request-promise-native');
const logger = require(`${approot}/config/winston`)('UW OpenData API');

const API_KEY = '';
const API_URI = 'https://api.uwaterloo.ca/v2';

const filterResponseCourse = (response) => {
    response.data = response.data.filter(entry => !entry.catalog_number.includes('`'));
    return response;
};

/**
 * Filter out known incorrect entries returned by UW API
 *
 * @param response - response from query to API
 * @param endpoint - the endpoint queried
 * @param qs - the query string used in query
 * @returns {*} - the response with the incorrect entries removed
 */
const filterResponse = (response, endpoint, qs) => {
    const fnMap = {
        '/courses': filterResponseCourse
    };
    if (fnMap.hasOwnProperty(endpoint)) {
        let new_response = fnMap[endpoint](response);
        logger.verbose(`Filtered out ${response.length - new_response.length} items from endpoint ${endpoint}`);
        return new_response;
    }
    else
        return response;
};

exports.get = async (resource, qs) => {
    try {
        var options = {
            method: 'GET',
            uri: `${API_URI}${resource}.json`,
            qs: Object.assign({key: API_KEY}, qs),
            json: true
        };
        logger.verbose(`Sending GET request to ${options.uri}`);
        var response = filterResponse(await rp(options), resource, qs);
    }
    catch (error) {
        logger.debug(`GET request failed at ${options.uri} with ${error}`);
        throw Error(error);
    }
    let responseCode = response['meta']['status'];
    if (responseCode === 200) {
        logger.verbose(`GET request to ${options.uri} succeeded with code ${responseCode}`);
        return response;
    }
    else {
        logger.error(`GET request to ${options.uri} failed with code ${responseCode}`);
        logger.error(JSON.stringify(response));
        throw Error(response);
    }
};
