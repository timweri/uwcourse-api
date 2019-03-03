const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const connUri = process.env.MONGO_LOCAL_CONN_URL;

  exports.add = (req, res) => {
      mongoose.connect(connUri, {useNewUrlParser: true}, (err) => {
          console.log("into db");
          let result = {};
          let status = 201;

          if(!err) {
              console.log("well before save");
              const { name, email, avatar_url, hashed_password, faculty, program, favourite_courses, terms } = req.body;
              const user = new User({ name, email, avatar_url, hashed_password, faculty, program, favourite_courses, terms });

              // TODO: add password hashing here
              console.log("before save");   
              user.save((err, user) => {
                  if(!err) {
                      result.status = status;
                      result.result = user;
                  }
                  else {
                      status = 500;
                      result.status = status;
                      result.error = err;  // in tutorial it is result.error ... what is result.err
                  }
                  res.status(status).send(result);
              });
          }
          else {
              console.log("db failed");
              status = 500;
              result.status = status;
              result.error = err;  // in tutorial it is result.error ... what is result.err
              res.status(status).send(result);
          }
      });
  };

  exports.login = (req, res) => {
      const { name, hashed_password } = req.body;

  mongoose.connect(connUri, { useNewUrlParser: true }, (err) => {
    let result = {};
    let status = 200;
    if(!err) {
      User.findOne({name}, (err, user) => {
        if (!err && user) {
          // We could compare passwords in our model instead of below
          bcrypt.compare(hashed_password, user.hashed_password).then(match => {
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
    } else {
      status = 500;
      result.status = status;
      result.error = err;
      res.status(status).send(result);
    }
  });
  };
