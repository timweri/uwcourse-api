const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const Term = require(`${approot}/models/Term`);
const uwapi = require('../config/uwopendata_api');

const fail = (err, extraMessages) => {
    if (err) logger.error(err.stack);
    if (extraMessages) {
        for (const message of extraMessages) {
            logger.error(message);
        }
    }
    logger.error(`${TAG} failed`);
    return 1;
};

/**
 * Scrape and parse term info to update Term model
 *
 * @returns {Promise<int>}
 */
module.exports = async () => {
    logger.info(`Starting ${TAG}`);

    let nearbyTerms;

    try {
        logger.verbose('Requesting list of nearby terms');
        nearbyTerms = (await uwapi.get('/terms/list', {})).data.listings;
    } catch (err) {
        return fail(err);
    }

    try {
        let nUpserted = 0;
        let nModified = 0;
        if (nearbyTerms != null) {
            for (const acadYear in nearbyTerms) {
                if (nearbyTerms.hasOwnProperty(acadYear)) {
                    for (const term of nearbyTerms[acadYear]) {
                        const result = await Term.findOneAndUpdate({
                            term_id: term.id.toString(),
                        }, {
                            term_id: term.id.toString(),
                            season: term.name.split(' ')[0],
                            year: parseInt(acadYear, 10),
                            updated_at: new Date(),
                        }, {
                            upsert: true,
                            useFindAndModify: false,
                            rawResult: true,
                            setDefaultsOnInsert: true,
                        });
                        if (result.lastErrorObject.updatedExisting === true) {
                            nModified++;
                        } else if (result.lastErrorObject.updatedExisting === false)  {
                            nUpserted++;
                        }
                    }
                }
            }
        }
        logger.info(`Created ${nUpserted} and modified ${nModified} terms in the Term database`);
    } catch (err) {
        return fail(err);
    }

    logger.info(`${TAG} finished`);
    return 0;
};
