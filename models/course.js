const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Course Schema
 */

const CourseSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Course title required'],
        match: [`^[a-zA-Z0-9 -'&:()/]+$`, 'Special characters not allowed']
    },
    subject: {
        type: String,
        required: [true, 'Course subject required'],
        match: [`^[A-Z]+$`, 'Only uppercase letters allowed'],
    },
    catalog: {
        type: String,
        required: [true, 'Course catalog required'],
        match: [`^[0-9]{3}[A-Z]??$`, 'Must be 3 digits numbers and maybe followed by a letter']
    },
    url: {
        type: String
    },
});

module.exports = mongoose.model('Course', CourseSchema);
