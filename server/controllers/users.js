const mongoose = require('mongoose');
const User = require('../models/user');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken')

exports.add = (req, res) => {
  let result = {};
  let status = 201;

  const { name, email, avatar_url, hashed_password, faculty, program, favourite_courses, terms } = req.body;
  const user = new User({ name, email, avatar_url, hashed_password, faculty, program, favourite_courses, terms });

  // TODO: add password hashing here
  console.log("before save");   
  user.save((err, user) => {
      if(!err) {
          console.log("finished");
          result.status = status;
          result.result = user;
      }
      else {
          console.log(err);
          status = 500;
          result.status = status;
          result.error = err;
      }
      res.status(status).send(result);
  });
};

exports.login = (req, res) => {
  let result = {};
  let status = 200;
  const { name, hashed_password } = req.body;

  mongoose.connection.on('connected', function() {  
    User.findOne({name}, (err, user) => {
      if (!err && user) {
        // We could compare passwords in our model instead of below
        argon2.verify(hashed_password, user.hashed_password).then(match => {
          if (match) {
            status = 200;
            // Create a token
            const payload = { user: user.name };
            const options = { expiresIn: '1h', issuer: 'uwcourse-api' };
            const secret = process.env.JWT_SECRET;
            const token = jwt.sign(payload, secret, options);

            // console.log('TOKEN', token);
            result.token = token;
            result.status = status;
            result.result = user;
          } else {
            status = 401;
            result.status = status;
            result.error = 'Authentication error';
          }
          res.status(status).send(result);
        }).catch(err => {
          status = 500;
          result.status = status;
          result.error = err;
          res.status(status).send(result);
        });
      } else {
        status = 404;
        result.status = status;
        result.error = err;
        res.status(status).send(result);
      }
    });
  });

  mongoose.connection.on('error', function(err) {
    status = 500;
    result.status = status;
    result.error = err;
    res.status(status).send(result);
  });
};
