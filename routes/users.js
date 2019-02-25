const controller = require('../controllers/users')

module.exports = (router) => {
    router.route('/users')
    .post(controller.add);

    router.route('/login')
    .post(controller.login);
};

/*users.get('/self', users_controllers.users_self);

users.put('/self', users_controllers.users_create);

users.post('/self', users_controllers.users_edit);

users.get('/:user_id', users_controllers.users_by_id);

users.get('/', (req, res) => {});*/