const controller_create = require('../controllers/users/users_create')
const controller_login = require('../controllers/users/users_login')
const controller_edit = require('../controllers/users/users_edit')
const controller_by_id = require('../controllers/users/users_by_id')
const controller_by_name = require('../controllers/users/users_by_name')
const controller_by_email = require('../controllers/users/users_by_email')
//const controller = require('../controllers/users/')
const validateToken = require('../utils/validate-token').validateToken;

module.exports = (router) => {
    router.route('/users')
        .post(controller_create.users_create);

    router.route('/users/:id')
        .put(validateToken, controller_edit.users_edit);

    router.route('/users_id')
        .get(validateToken, controller_by_id.users_by_id);

    router.route('/users_name')
        .get(validateToken, controller_by_name.users_by_name);

    router.route('/users_email')
        .get(validateToken, controller_by_email.users_by_email);

    router.route('/login')
        .post(controller_login.users_login);
};
