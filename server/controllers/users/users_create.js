const User = require('../../models/User');

exports.users_create = (req, res) => {
  let result = {};
  let status = 201;

  const { name, email, avatar_url, hashed_password, faculty, program, favourite_courses, terms } = req.body;
  const user = new User({ name, email, avatar_url, hashed_password, faculty, program, favourite_courses, terms });

  // TODO: add password hashing here
  user.save((err, user) => {
      if(!err) {
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