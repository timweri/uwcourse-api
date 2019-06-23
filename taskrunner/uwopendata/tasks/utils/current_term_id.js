const approot = require('app-root-path');
const Term = require(`${approot}/models/Term`);
const uwapi = require(`${approot}/uwopendata/config/uwopendata_api`);

/**
 * Fetch both the MongoDB internal ID and UW ID of the current term
 *
 * @param logger
 * @param TAG
 * @returns {function(): {uw_id: *, internal_id: *}}
 */
module.exports = (logger, TAG) => async () => {
    logger.error(`${TAG} failed`);
    logger.verbose('Requesting current term id');
    const currentUWTermId = (await uwapi.get('/terms/list', {})).data.current_term.toString();
    logger.verbose(`Current term id: ${currentUWTermId}`);

    logger.verbose('Getting internal current term id');
    const term = await Term.findOne({term_id: currentUWTermId});
    logger.verbose(`Current internal term id: ${term._id}`);
    return {
        internal_id: term._id,
        uw_id: currentUWTermId,
    };
};
