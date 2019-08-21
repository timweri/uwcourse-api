const approot = require('app-root-path');
const express = require('express');
const requireDir = require('require-dir');
const userController = requireDir(`${approot}/controllers/users`);
const validateToken = require(`${approot}/controllers/validate_token`);
const userRouter = express.Router();

userRouter.post('/verification', userController.send_confirmation_email);
userRouter.get('/verification', userController.verify_confirmation_code);

userRouter.post('/tokens', userController.login);

userRouter.get('/:id', userController.get_user_by_id);
userRouter.post('/', userController.create_user);

userRouter.use(validateToken);
userRouter.get('/self', userController.get_self);
userRouter.put('/self', userController.modify_self);
userRouter.put('/self/password', userController.modify_self_password);
userRouter.delete('/self', userController.delete_self);

module.exports = userRouter;
