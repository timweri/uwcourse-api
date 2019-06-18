const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
        value: {type: Number, required: true},
        count: {type: Number, required: true},
}, {_id: false});
