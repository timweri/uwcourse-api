const approot = require('app-root-path');
const requireDir = require('require-dir');
const user_controller = requireDir(`${approot}/controllers/users`);
const check_empty_body = require(`${approot}/controllers/check_empty_body`);

module.exports = (router) => {
    router.post(
        [
            '/users',
            '/users/tokens',
            '/users/self',
        ],
        check_empty_body,
    );

    router.put('/users', user_controller.users_register);
    router.post('/users/tokens', user_controller.users_login);

    router.get('/users/:email', user_controller.users_get_by_email);

    router.use(
        [
            '/users/self',
        ],
        user_controller.users_validate_token,
    );

    router.use(
        [
            '/users/self',
        ],
        user_controller.users_fetch_token_user,
    );

    router.get('/users/self', user_controller.users_get_self);

    router.post('/users/self', user_controller.users_modify_self);
};
