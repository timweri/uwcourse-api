const cron = require('node-cron');

const mongoose = require('mongoose');
const upsertMany = require('@meanie/mongoose-upsert-many');
mongoose.plugin(upsertMany);

const uwopendataTasks = require('require.all')('./uwopendata/tasks');
const logger = require('./config/winston')();

mongoose.connect('mongodb://mongodb:27017/uwcourseapi', {useNewUrlParser: true, useCreateIndex: true});

mongoose.connection.on('error', () => {
    logger.error('Connection error: unable to connect to uwcourseapi database');
});

// Start scheduling tasks when the database connects
mongoose.connection.once('open', async () => {
    logger.info('Successfully connected to database uwcourseapi');

    await uwopendataTasks.scrape_courses({first_run: true});
    await uwopendataTasks.scrape_courses_schedule({first_run: true});
    //cron.schedule('*/5 * * * *', async () => {
    //    await uwopendataTasks.scrape_courses();
    //    logger.info('Task `scrape_courses` completed');
    //});
});
