const cron = require('node-cron');
const uwopendataTasks = require('require.all')('./uwopendata/tasks');
const logger = require('./config/winston')();

const mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb:27017/uwcourseapi', {useNewUrlParser: true, useCreateIndex: true});

mongoose.connection.on('error', () => {
    logger.error('Connection error: unable to connect to uwcourseapi database');
});

// Start scheduling tasks when the database connects
mongoose.connection.once('open', async () => {
    logger.info('Successfully connected to database uwcourseapi');

    await uwopendataTasks.scrape_courses();
    logger.info('Task `scrape_courses` completed');
    //cron.schedule('*/5 * * * *', async () => {
    //    await uwopendataTasks.scrape_courses();
    //    logger.info('Task `scrape_courses` completed');
    //});
});
