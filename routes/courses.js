const express = require('express');
const courses = express.Router();

const courses_controllers = require('require.all')('../controllers/courses');
const courseratings_controllers = require('require.all')('../controllers/courseratings');

courses.get('/', courses_controllers.courses_list);

courses.get('/:course_id', courses_controllers.courses_by_id);

courses.post('/:course_id/ratings');

courses.put('/:course_id/ratings');

courses.put('/:course_id/ratings');

module.exports = courses;
