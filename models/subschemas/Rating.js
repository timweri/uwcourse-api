const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = new Schema({
        type: Number,
        required: true,
        validate: {
            validator: Number.isInteger,
        },
        min: 0,
        max: 5,
}, {_id: false});
