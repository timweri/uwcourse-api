const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = rating_name => {
    return new Schema({
        value: {type: Number, required: [true, `${rating_name} rating missing`]},
        count: {type: Number, required: [true, `${rating_name} rating count missing`]}
    });
};
