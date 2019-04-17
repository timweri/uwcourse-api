const controller_create = require('../controllers/users/users_create')
const controller_login = require('../controllers/users/users_login')
const controller_edit = require('../controllers/users/users_edit')
//const controller = require('../controllers/users/')
const validateToken = require('../utils/validate-token').validateToken;

module.exports = (router) => {
    router.route('/users')
        .post(controller_create.users_create);
    //.get(validateToken, controller.add);

    router.route('/users/:id')
        .put(controller_edit.users_edit);
        // .put(function (req, res) {
        //     res.send('Update the book')
        // })
        //.put(validateToken, controller_edit.users_edit);

    router.route('/login')
        .post(controller_login.users_login);
};
