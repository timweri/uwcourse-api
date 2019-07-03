const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const result = {};

    const user = req.user;
    const changes = {$set: {}, $addToSet: {}};

    for (const key in req.body) {
        let newErr;
        if (req.body.hasOwnProperty(key)) {
            switch (key) {
                case 'name':
                case 'avatar_url':
                case 'faculty':
                case 'program':
                    changes.$set[key] = req.body[key];
                    break;
                case 'favourite_courses':
                    changes.$addToSet[key] = req.body[key];
                    break;
                case 'terms':
                    break;
                default:
                    newErr = new Error(`Cannot modify field ${key}`);
                    newErr.status = 400;
                    next(newErr);
                    logger.info(newErr.message);
                    return;
            }
        }
    }

    try {
        await user.updateOne(changes, {runValidators: true});
    } catch (err) {
        next(err);
        return;
    }

    result.status = 200;
    result.message = 'Successfully updated profile';
    logger.info(`Successfully updated ${user.email}'s profile`);
    res.status(result.status).send(result);
};
