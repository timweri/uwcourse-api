const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');
const config = require(`${approot}/config/config`);

const passwordValidator = require(`${approot}/utils/users/validators/password_validator`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const response = {};

    if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
        const newErr = new Error('Missing username and/or password');
        newErr.status = 400;
        return next(newErr);
    }

    const password = req.body.password;
    const username = req.body.username.toLowerCase();

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

    const token_key = randomstring.generate(config.app.token_key_length);

    const user = new User({
        username,
        token_key,
        password: hashed_password,
        last_login_at: new Date(),
    });

    try {
        await user.save();
    } catch (err) {
        next(err);
        logger.info(`Failed to create user ${username}`);
        return;
    }
    logger.verbose(`Created user ${username}`);
    response.data = jwt.sign({username, token_key}, config.secret, {expiresIn: '3h'});
    res.status(201).send(response);
};
