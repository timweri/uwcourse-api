const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const User = require(`${approot}/models/User`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);

module.exports = async (req, res, next) => {
    logger.setId(req.id);

    const response = {};

    if (!req.query.hasOwnProperty('username')) {
        return next(errorBuilder('Missing username', 400));
    }

    const username = req.query.username.toLowerCase();
    let limit = 20;
    let skip = 0;
    let anchorLeft = true;
    let anchorRight = false;

    if (!/^[a-z0-9]+$/.test(username)) {
        return res.sendStatus(204);
    }

    if (req.query.hasOwnProperty('limit')) {
        const temp = parseInt(req.query.limit);
        if (!isNaN(temp) && temp > 0) limit = temp;
    }

    if (req.query.hasOwnProperty('skip')) {
        const temp = parseInt(req.query.skip);
        if (!isNaN(temp) && temp > 0) skip = temp;
    }

    if (req.query.hasOwnProperty('anchor_left')) {
        const temp = parseInt(req.query.anchor_left);
        if (!isNaN(temp)) {
            anchorLeft = temp !== 0;
        }
    }

    if (!anchorLeft && req.query.hasOwnProperty('anchor_right')) {
        const temp = parseInt(req.query.anchor_right);
        if (!isNaN(temp)) {
            anchorRight = temp === 1;
        }
    }

    const regex = (anchorLeft ? '^' : '') + username + (anchorRight ? '$' : '');

    let users;
    try {
        users = await User.find({
            username: { $regex: regex },
        }, [
            'username',
            'name',
            'avatar_url',
        ]).limit(limit)
            .skip(skip);
    } catch (err) {
        return next(err);
    }

    response.data = users;

    res.status(200).send(response);
};
