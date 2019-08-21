const approot = require('app-root-path');
const express = require('express');
const courseRouter = express.Router();
const requireDir = require('require-dir');
const courseController = requireDir(`${approot}/controllers/courses`);
const validateTokenOptional = require(`${approot}/controllers/validate_token_optional`);
const validateToken = require(`${approot}/controllers/validate_token`);

courseRouter.get(['/:id'], validateTokenOptional);
courseRouter.get('/details/:id', courseController.get_course_detail_by_id);
courseRouter.get('/details', courseController.get_course_details);
courseRouter.get('/:id', courseController.get_course_by_id);
courseRouter.get('/', courseController.search_courses);

courseRouter.put('/:id/likesdislikes', validateToken);
courseRouter.put('/:id/likesdislikes', courseController.like_dislike);

courseRouter.post('/:id/reviews', validateToken);
courseRouter.post('/:id/reviews', courseController.create_review);

courseRouter.put('/:id/reviews', validateToken);
courseRouter.put('/:id/reviews', courseController.modify_review);

module.exports = courseRouter;
