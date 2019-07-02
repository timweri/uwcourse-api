const approot = require('app-root-path');
const users = require('./users');
const errorHandler = require(`${approot}/controllers/error`);

module.exports = (router) => {
    users(router);

    router.use(errorHandler);

    return router;
};
