const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const config = require(`${approot}/config/config`);
const User = require(`${approot}/models/User`);
const UserConfirmationCode = require(`${approot}/models/UserConfirmationCode`);
const transporter = require(`${approot}/config/nodemailer`);
const nodemailer = require('nodemailer');
const cryptoRandomString = require('crypto-random-string');
const buildErrorResponse = require(`${approot}/controllers/utils/build_error_response`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const {username, type} = req.query;

        const newConfirmationCode = cryptoRandomString({length: config.confirmation_code.length, type: 'url-safe'});

        switch (type) {
            case 'REGISTRATION': {
                // Check if user already exists
                const user = await User.findOne({username}, '_id');
                if (user) {
                    return next(buildErrorResponse('USERNAME_EXISTS', 409));
                }
                break;
            }
        }

        let confirmationCodeDocument = await UserConfirmationCode.findOne({username, type: type});
        if (!confirmationCodeDocument) {
            confirmationCodeDocument = new UserConfirmationCode({
                username,
                confirmation_code: newConfirmationCode,
                type: type,
                created_at: new Date(),
            });
        } else {
            confirmationCodeDocument.confirmation_code = newConfirmationCode;
            confirmationCodeDocument.created_at = new Date();
        }
        await confirmationCodeDocument.save();

        // TODO: Properly format email
        const info = await transporter.sendMail({
            from: `"${config.email.name}" <${config.email.auth.user}>`,
            to: `${username}@uwaterloo.ca`,
            subject: 'UWCourse Confirmation Email',
            text: `Confirmation code: ${confirmationCodeDocument.confirmation_code}`,
        });

        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        logger.info(`Confirmation email of type \`${type}\` sent`);
        logger.info('Returning 204');
        return res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};
