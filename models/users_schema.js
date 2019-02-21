const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User Schema Subdocuments
 */

const CompactCourse = new Schema({
    id: {type: Schema.Types.ObjectId, ref: 'Course', required: true},
    title: {type: String, required: true},
    subject: {type: String, required: true},
    catalog: {type: String, required: true},
    rating: new Schema({
        value: {type: Number, required: true},
        count: {type: Number, required: true}
    })
});

const CompactTerm = new Schema({
    id: {type: Schema.Types.ObjectId, ref: 'Term', required: true},
    title: {type: String, required: true},
    courses: [CompactCourse]
});

/**
 * User Schema
 */

const UserSchema = new Schema({
    username: {type: String, required: [true, 'Username required'], index: true, unique: true},
    name: {type: String, required: [true, 'Name required']},
    email: {type: String, required: [true, 'Email required'], match: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', index: true, unique: true},
    avatar_url: {type: String, default: ''},
    hashed_password: {type: String, required: [true, 'Password required']},
    faculty: {type: Number, required: true},
    program: {type: Number, required: true},
    favourite_courses: [CompactCourse],
    terms: [CompactTerm]
});



module.exports = mongoose.model('User', UserSchema);
