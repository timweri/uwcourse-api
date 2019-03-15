require('dotenv').config();

const express = require('express');

const bodyParser = require('body-parser');

const app = express();
const router = express.Router();
const stage = require('./config');

const routes = require('./routes/index.js');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


// if (environment !== 'production') {
//   app.use(logger('dev'));
// }

app.use('/api/v1', routes(router));
// app.use('/api/v1', (req, res, next) => {
//   res.send('Hello');
//   next();
// });

app.listen(`${stage.development.port}`, () => {
  console.log(`Server now listening at localhost:${stage.development.port}`);
});

module.exports = app;
