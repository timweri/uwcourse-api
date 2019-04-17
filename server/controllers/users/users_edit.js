const User = require('../../models/User');
const Timestamp = require('../../utils/timestamp');

// Edit current user profile
exports.users_edit = (req, res) => {
  let result = {};
  let status = 200;

  User.findByIdAndUpdate(req.params.id, req.body, {new: true}, async (err, user) => {
    if (!err && user) {
        try{
            user.last_updated_at = Timestamp.generateTimestamp();
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
