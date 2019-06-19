const cron = require('node-cron');

const mongoose = require('mongoose');
const bulkOp = require('mongoose-bulkop');
const immutable = require('mongoose-immutable-plugin');
mongoose.plugin(bulkOp);
mongoose.plugin(immutable);

const requireDir = require('requiredir');
const uwopendataTasks = requireDir('./uwopendata/tasks');
const logger = require('./config/winston')();

mongoose.connect('mongodb://mongodb:27017/uwcourseapi', {useNewUrlParser: true, useCreateIndex: true});

mongoose.connection.on('error', () => {
    logger.error('Connection error: unable to connect to uwcourseapi database');
});

// Start scheduling tasks when the database connects
mongoose.connection.once('open', async () => {
    logger.info('Successfully connected to database uwcourseapi');

    await uwopendataTasks.scrape_courses();
    await uwopendataTasks.scrape_courses_schedule();
    //cron.schedule('*/5 * * * *', async () => {
    //    await uwopendataTasks.scrape_courses();
    //    logger.info('Task `scrape_courses` completed');
    //});
});
