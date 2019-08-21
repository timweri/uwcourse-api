const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const config = require(`${approot}/config/config`);
const User = require(`${approot}/models/User`);
const UserConfirmationCode = require(`${approot}/models/UserConfirmationCode`);
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const {username, confirmation_code, type} = req.query;

        const confirmationCodeDocument = await UserConfirmationCode.findOne({username, confirmation_code});
        if (!confirmationCodeDocument || confirmationCodeDocument.type !== type) {
            return next(buildErrorResponse('INVALID_CONFIRMATION_CODE', 404));
        }

        switch (type) {
            case 'REGISTRATION': {
                // Check if user already exists
                const user = await User.findOne({username}, '_id');
                if (user) {
                    UserConfirmationCode.deleteOne({username, confirmation_code});
                    return next(buildErrorResponse('USERNAME_EXISTS', 409));
                }
                break;
            }
        }

        logger.info('Valid code');
        logger.info('Returning 204');
        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};
