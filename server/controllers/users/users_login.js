const User = require('../../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken')
const approot = require('app-root-path');
const { JWT_SECRET } = require(`${approot}/config/config`);

exports.users_login = (req, res) => {
  let result = {};
  let status = 200;
  const { email, hashed_password } = req.body;

  User.findOne({email}, async (err, user) => {
    if (!err && user) {
      // We could compare passwords in our model instead of below
      try {
        if (await argon2.verify(user.hashed_password, hashed_password)) {
          status = 200;
          // Create a token
          const payload = { user: user.name };
          const options = { expiresIn: '1h', issuer: 'uwcourse-api' };
          const secret = JWT_SECRET;
          const token = jwt.sign(payload, secret, options);

          // console.log('TOKEN', token);
          result.token = token;
          result.status = status;
          result.result = user;
        }
        else {
          status = 401;
          result.status = status;
          result.error = 'Authentication error';
        }

        res.status(status).send(result);
      }
      catch (err) {
        status = 500;
        result.status = status;
        result.error = err;
        res.status(status).send(result);
      }
    } else {
      status = 404;
      result.status = status;
      result.error = err;
      res.status(status).send(result);
    }
  });
};
