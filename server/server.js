require('dotenv').config();

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const router = express.Router();
const stage = require('./config/config');
const routes = require('./routes/index.js');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb:27017/uwcourseapi', {useNewUrlParser: true});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error: unable to connect to uwcourseapi database'));

db.once('open', () => {
    console.log('Successfully connected to database uwcourseapi');

    app.use('/api/v1', routes(router));

    app.listen(`${stage.development.port}`, () => {
        console.log(`Server now listening at localhost:${stage.development.port}`);
    });
});
