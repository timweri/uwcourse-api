const approot = require('app-root-path');
const path = require('path');
const TAG = path.basename(__filename);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const config = require(`${approot}/config/config`);

const passwordValidator = require(`${approot}/utils/users/validators/password_validator`);

module.exports = async (req, res, next) => {
    const result = {};

    if (!req.body.hasOwnProperty('email') || !req.body.hasOwnProperty('password')) {
        const newErr = new Error('Missing Email and/or Password');
        newErr.status = 400;
        return next(newErr);
    }

    const {email, password} = req.body;

    // Validate password
    if (!passwordValidator.test(password)) {
        const newErr = new Error('Invalid password');
        newErr.status = 400;
        return next(newErr);
    }

    let hashed_password;
    try {
        hashed_password = await argon2.hash(password);
    } catch (err) {
        const newErr = new Error();
        newErr.status = 500;
        next(newErr);
        logger.error('Failed to hash password');
        return;
    }

    const user = new User({
        email,
        password: hashed_password,
        last_login_at: new Date(),
    });

    try {
        await user.save();
    } catch (err) {
        next(err);
        logger.info(`Failed to create user ${email}`);
        return;
    }
    logger.verbose(`Created user ${email}`);
    result.status = 201;
    result.result = jwt.sign({email: email}, config.secret, {expiresIn: '3h'});
    res.status(result.status).send(result);
};
