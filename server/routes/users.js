const express = require('express');
const users = express.Router();

const users_controllers = require('require.all')('../controllers/users');

users.get('/self', users_controllers.users_self);

users.put('/self', users_controllers.users_create);

users.post('/self', users_controllers.users_edit);

users.get('/:user_id', users_controllers.users_by_id);

users.get('/', (req, res) => {});

module.exports = users;
