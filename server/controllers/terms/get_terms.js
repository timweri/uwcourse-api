const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const config = require(`${approot}/config/config`);
const Term = require(`${approot}/models/Term`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);
const parseComparisonOpt = require(`${approot}/controllers/utils/parse_comparison_opt`);
const parseLimit = require(`${approot}/controllers/utils/parse_limit`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const {uw_term_id, season, term_id, year, cursor} = req.query;
        let {limit} = req.query;
        const queryObj = {};

        limit = parseLimit(limit);

        if (cursor) {
            queryObj._id = {$lt: cursor};
        }

        if (uw_term_id) {
            queryObj.uw_term_id = uw_term_id;
        }

        if (season) {
            queryObj.season = season;
        }

        parseComparisonOpt(term_id, 'term_id', queryObj);
        parseComparisonOpt(year, 'year', queryObj, 'int');

        const terms = await Term.find(queryObj).sort({_id: -1}).limit(limit);
        const response = {
            data: terms,
        };

        if (terms.length > 0) {
            response.cursor = terms[terms.length - 1]._id;
        }

        logger.info('Returning 200');
        res.status(200)
            .send(response);
    } catch (err) {
        if (err.name === 'CastError' && err.kind === 'ObjectId') {
            return next(buildErrorResponse('INVALID_OBJECT_ID', 400));
        }
        next(err);
    }
};
