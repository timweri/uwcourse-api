const approot = require('app-root-path');
const userRouter = require('./user_router');
const courseRouter = require('./course_router');
const termRouter = require('./term_router');
const errorHandler = require(`${approot}/controllers/error`);

module.exports = (router) => {
    router.get('/ping', (req, res, next) => {
        return res.sendStatus(204);
    });
    router.use('/users', userRouter);
    router.use('/courses', courseRouter);
    router.use('/terms', termRouter);

    router.use(errorHandler);

    return router;
};
