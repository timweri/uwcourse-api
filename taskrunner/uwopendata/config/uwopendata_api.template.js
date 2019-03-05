const approot = require('app-root-path');
const rp = require('request-promise-native');
const logger = require(`${approot}/config/winston`)('UW OpenData API');

const API_KEY = '';
const API_URI = 'https://api.uwaterloo.ca/v2';

exports.get = async (resource, qs) => {
    try {
        let options = {
            method: 'GET',
            uri: `${API_URI}${resource}.json`,
            qs: Object.assign({key: API_KEY}, qs),
            json: true
        };
        logger.info(`Sending GET request to \`${API_URI}${resource}.json\``);
        return await rp(options);
    }
    catch (error) {
        logger.error(`GET request failed at \`${API_URI}${resource}.json\``);
        throw Error(error);
    }
};
