const controller_create = require('../controllers/users/users_create')
const controller_login = require('../controllers/users/users_login')
//const controller = require('../controllers/users/')
const validateToken = require('../utils/validate-token').validateToken;

module.exports = (router) => {
    router.route('/users_create')
    .post(controller_create.users_create);
    //.get(validateToken, controller.add);

    router.route('/users_login')
    .post(controller_login.users_login);
};
