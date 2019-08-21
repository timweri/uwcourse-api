const approot = require('app-root-path');
const express = require('express');
const termRouter = express.Router();
const requireDir = require('require-dir');
const termController = requireDir(`${approot}/controllers/terms`);

termRouter.get('/:id', termController.get_term_by_id);
termRouter.get('/', termController.get_terms);

module.exports = termRouter;
