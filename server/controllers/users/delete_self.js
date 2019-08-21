const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const config = require(`${approot}/config/config`);
const argon2 = require('argon2');
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const user = req.token.user;
        const {password} = req.body;

        if (!password) {
            return next(buildErrorResponse('PASSWORD_REQUIRED', 400));
        }

        if (await argon2.verify(user.password, password)) {
            await user.deleteOne();
        } else {
            return next(buildErrorResponse('WRONG_USERNAME_PASSWORD', 401));
        }

        logger.info('Returning 204');
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};
