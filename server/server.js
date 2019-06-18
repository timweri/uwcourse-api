const logger = require('./config/winston')(__filename.slice(__dirname.length + 1, -3));

const express = require('express');
const app = express();
const router = express.Router();
const routes = require('./routes/index.js');

const config = require('./config/config');

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

const mongoose = require('mongoose');
mongoose.connect(`${config.db.host}:${config.db.port}/${config.db.name}`, {useNewUrlParser: true});
const db = mongoose.connection;

db.on('error', logger.error.bind(logger, 'Connection error: unable to connect to uwcourseapi database'));

db.once('open', () => {
    logger.verbose('Successfully connected to database uwcourseapi');

    app.use(config.app.endpoint, routes(router));

    app.listen(config.app.port, () => {
        logger.verbose(`Server now listening at localhost:${config.app.port}`);
        console.log(`Server now listening at localhost:${config.app.port}`);
    });
});
