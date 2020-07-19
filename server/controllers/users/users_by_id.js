const User = require('../../models/User');

// Retrieve a user profile with given ID
exports.users_by_id = (req, res) => {
  let result = {};
  let status = 200;

  User.findById(req.body, async (err, user) => {
    if (!err && user) {
        try{
            status = 200;
            result.status = status;
            result.result = user;
            res.status(status).send(result);
        }
        catch (err) {
            status = 500; //check these codes
            result.status = status;
            result.error = err;
            res.status(status).send(result);
          }
    } else {
      status = 500; //check these codes
      result.status = status;
      result.error = err;
      res.status(status).send(result);
    }
  });
};
