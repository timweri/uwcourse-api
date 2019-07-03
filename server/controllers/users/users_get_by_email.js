const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);

const emailValidator = require(`${approot}/utils/users/validators/email_validator`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const result = {};

    const paramEmail = req.params.email.toLowerCase();

    if (paramEmail === 'self') return next();

    let email = paramEmail;
    if (emailValidator.testWithoutEmailSuffix(paramEmail)) email = paramEmail + '@uwaterloo.ca';
    if (!emailValidator.testWithEmailSuffix(email)) {
        const newErr = new Error('Invalid email');
        newErr.status = 400;
        next(newErr);
        logger.info(`Invalid email ${paramEmail}`);
        return;
    }

    if (email == null) {
        return next(new Error('Email cannot be null'));
    }

    let user;
    try {
        user = await User.findOne({email});
    } catch (err) {
        return next(err);
    }

    if (!user) {
        const newErr = new Error('User not found');
        newErr.status = 404;
        next(newErr);
        logger.info(`User ${email} not found`);
        return;
    }

    result.status = 200;
    result.data = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        favourite_courses: user.favourite_courses,
        terms: user.terms,
        created_at: user.created_at,
    };

    res.status(result.status).send(result);
};
