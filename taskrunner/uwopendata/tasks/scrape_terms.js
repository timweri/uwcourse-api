const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const Term = require(`${approot}/models/Term`);
const uwapi = require('../config/uwopendata_api');
const fail = require('./utils/fail_task')(logger, TAG);

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

    try { // Upserting terms
        let nUpserted = 0;
        let nModified = 0;
        if (nearbyTerms != null) {
            for (const acadYear in nearbyTerms) {
                if (nearbyTerms.hasOwnProperty(acadYear)) {
                    for (const term of nearbyTerms[acadYear]) {
                        const result = await Term.findOneAndUpdate({
                            uw_term_id: term.id.toString(),
                        }, {
                            uw_term_id: term.id.toString(),
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

    try { // Resolving next and previous
        let nModified = 0;
        if (nearbyTerms != null) {
            for (const acadYear in nearbyTerms) {
                if (nearbyTerms.hasOwnProperty(acadYear)) {
                    for (const term of nearbyTerms[acadYear]) {
                        const termInDatabase = await Term.findOne({uw_term_id: term.id.toString()});
                        const year = parseInt(acadYear, 10);
                        const season = term.name.split(' ')[0];
                        const curNextTermId = termInDatabase.next ? termInDatabase.next.toString() : null;
                        const curPreviousTermId = termInDatabase.previous ? termInDatabase.previous.toString() : null;
                        let nextTermId = null;
                        let previousTermId = null;

                        { // find nextTermId
                            let nextTermYear = year;
                            let nextTermSeason = season;

                            switch (season) {
                                case 'Winter':
                                    nextTermSeason = 'Spring';
                                    break;
                                case 'Spring':
                                    nextTermSeason = 'Fall';
                                    break;
                                case 'Fall':
                                    nextTermSeason = 'Winter';
                                    ++nextTermYear;
                                    break;
                            }

                            const nextTermInDatabase = await Term.findOne({
                                year: nextTermYear,
                                season: nextTermSeason,
                            });

                            if (nextTermInDatabase) nextTermId = nextTermInDatabase._id.toString();
                        }

                        { // find previousTermId
                            let previousTermYear = year;
                            let previousTermSeason = season;

                            switch (season) {
                                case 'Winter':
                                    previousTermSeason = 'Fall';
                                    previousTermYear--;
                                    break;
                                case 'Spring':
                                    previousTermSeason = 'Winter';
                                    break;
                                case 'Fall':
                                    previousTermSeason = 'Spring';
                                    break;
                            }

                            const previousTermInDatabase = await Term.findOne({
                                year: previousTermYear,
                                season: previousTermSeason,
                            });

                            if (previousTermInDatabase) previousTermId = previousTermInDatabase._id.toString();
                        }

                        if (previousTermId || nextTermId) {
                            if (curPreviousTermId !== previousTermId || curNextTermId !== nextTermId) ++nModified;
                            if (curPreviousTermId !== previousTermId) termInDatabase.previous = previousTermId;
                            if (curNextTermId !== nextTermId) termInDatabase.next = nextTermId;
                            await termInDatabase.save();
                        }
                    }
                }
            }
        }
        logger.info(`Updated \`previous\` and \`next\` of ${nModified} terms`);
    } catch (err) {
        return fail(err);
    }

    logger.info(`${TAG} finished`);
    return 0;
};
