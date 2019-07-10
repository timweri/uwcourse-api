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
            '/users/favourite_courses',
        ],
        check_empty_body,
    );

    router.get(
        [
            '/users/self',
            '/users/:username',
        ],
        user_controller.users_parse_populate_profile_flags,
    );

    router.put('/users', user_controller.users_register);
    router.post('/users/tokens', user_controller.users_login);

    router.get('/users/:username', user_controller.users_get_by_username);

    router.use(
        [
            '/users/self',
            '/users/favourite_courses',
        ],
        user_controller.users_validate_token,
    );

    router.use(
        [
            '/users/self',
            '/users/favourite_courses',
        ],
        user_controller.users_fetch_token_user,
    );

    router.post('/users/favourite_courses', user_controller.users_modify_fav_courses);

    router.get('/users/self', user_controller.users_get_self);

    router.post('/users/self', user_controller.users_modify_self);

    router.get('/users', user_controller.users_search_by_username);
};
