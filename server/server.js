const express = require('express');
const app = express();
const PORT = 5000;

const mongoose = require('mongoose');
mongoose.connect('mongodb://mongodb:27017/uwcourseapi', {useNewUrlParser: true});
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error: unable to connect to uwcourseapi database'));
db.once('open', () => {
    console.log('Successfully connected to database uwcourseapi');

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
