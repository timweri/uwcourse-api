// Format is YYYY-MM-DD HH:MM:SS
const TimestampExpression = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

exports.timestamp_expr = TimestampExpression;

exports.validate_timestamp = (timestamp) => {
    return new Promise((resolve, reject) => {
        if (TimestampExpression.test(timestamp))
            resolve(true);
        else
            reject(false);
    });
};
