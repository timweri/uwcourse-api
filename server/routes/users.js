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

    router.post('/users', user_controller.users_register);
    router.post('/users/tokens', user_controller.users_login);

    router.use(
        [
            '/users/self',
        ],
        user_controller.users_validate_token,
    );

    router.get(
        [
            '/users/self',
        ],
        user_controller.users_fetch_token_user,
    );

    router.get('/users/self', user_controller.users_get_self);

    router.use(user_controller.users_error);
};
