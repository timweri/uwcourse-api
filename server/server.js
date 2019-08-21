const logger = require('./config/winston')(__filename.slice(__dirname.length + 1, -3));

const express = require('express');
const addRequestId = require('express-request-id')();

const app = express();
const router = express.Router();
const routes = require('./routes/api/index.js');

const ip = require('./controllers/ip');
const unsupportedEndpoint = require('./controllers/unsupported_endpoint');

const config = require('./config/config');

const bodyParser = require('body-parser');

app.set('trust proxy', true);
app.use(addRequestId);

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use((req, res, next) => {
    bodyParser.json()(req, res, err => {
        const result = {};
        if (err) {
            result.status = 400;
            result.error = 'Invalid JSON body';
            return res.status(400).send(result);
        }

        next();
    });
});

const mongoose = require('mongoose');
mongoose.connect(`${config.db.host}:${config.db.port}/${config.db.name}`, {useNewUrlParser: true, useCreateIndex: true});
const db = mongoose.connection;

db.on('error', logger.error.bind(logger, 'Connection error: unable to connect to uwcourseapi database'));

db.once('open', () => {
    logger.verbose('Successfully connected to database uwcourseapi');

    app.use(ip);
    app.use(config.app.endpoint, routes(router));
    app.use(unsupportedEndpoint);

    app.listen(config.app.port, () => {
        logger.verbose(`Server now listening at localhost:${config.app.port}`);
    });
});
