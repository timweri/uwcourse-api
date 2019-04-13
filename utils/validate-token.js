const jwt = require('jsonwebtoken');
const approot = require('app-root-path');
const { JWT_SECRET } = require(`${approot}/config/config`);

module.exports = {
    validateToken: (req, res, next) => {
        const authorizationHeader = req.headers.authorization;
        let result;

        if (authorizationHeader) {
            const token = req.headers.authorization.split(' ')[1]; // Bearer <token>
            const options = {
              expiresIn: '1h',
              issuer: 'uwcourse-api'
            };
            try {
              result = jwt.verify(token, JWT_SECRET, options);
              req.decoded = result;
              next();
            } catch (err) {
              throw new Error(err);
            }
          } else {
            result = { 
              error: `Authentication error. Token required.`,
              status: 401 
            };
            res.status(401).send(result);
          }
    }
}
