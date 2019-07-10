const approot = require('app-root-path');
const TAG = __filename.slice(__dirname.length + 1, -3);
const logger = require(`${approot}/config/winston`)(TAG);
const objectIdValidator = require(`${approot}/utils/validators/objectid_validator`);
const errorBuilder = require(`${approot}/controllers/utils/error_response_builder`);
const Course = require(`${approot}/models/Course`);

module.exports = async (req, res, next) => {
    try {
        logger.setId(req.id);

        const user = req.user;
        let add = [];
        let remove = [];
        const update = {};

        if (!req.body.hasOwnProperty('add') && !req.body.hasOwnProperty('remove')) {
            return next(errorBuilder(null, 400));
        }

        if (req.body.hasOwnProperty('add')) {
            add = req.body.add;
            if (!Array.isArray(add) || add.length <= 0 || !(await objectIdValidator.testObjectIdsExists(add, Course))) {
                logger.info('Invalid field: add');
                return next(errorBuilder('Invalid field: add', 400));
            }
            add = add.filter(v => !user.favourite_courses.includes(v));
            update.$push = {favourite_courses: add};
        }

        if (req.body.hasOwnProperty('remove')) {
            remove = req.body.remove;
            if (!Array.isArray(remove) || remove.length <= 0 || !(await objectIdValidator.testObjectIdsExists(remove, Course))) {
                logger.info('Invalid field: remove');
                return next(errorBuilder('Invalid field: remove', 400));
            }
            remove = remove.filter(v => user.favourite_courses.includes(v));
            update.$pull = {favourite_courses: {$in: remove}};
        }

        if (Object.keys(update).length > 0) {
            const result = await user.updateOne(update);
            if (!result || result.nModified !== 1) {
                return next(new Error(`Failed to modify favourite courses for ${user.username}`));
            }
        }

        logger.info(`Edited favourite courses for ${user.username}`);
        res.sendStatus(204);

        for (const added of add) {
            const result = await Course.findById(added).updateOne({$inc: {liked_count: 1}});
            if (!result || result.nModified !== 1) {
                return next(new Error(`Failed to increment liked_count for ${added}`));
            }
        }

        for (const removed of remove) {
            const result = await Course.findById(removed).updateOne({$inc: {liked_count: -1}});
            if (!result || result.nModified !== 1) {
                return next(new Error(`Failed to decrement liked_count for ${removed}`));
            }
        }
    } catch (err) {
        return next(err);
    }
};
