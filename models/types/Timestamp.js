const timestamp_validator = require('../../utils/database/validators/validate_timestamp');

module.exports = {
    type: String,
    required: [true, 'Timestamp is required'],
    match: [timestamp_validator.timestamp_expr.source, 'Invalid timestamp format']
};
