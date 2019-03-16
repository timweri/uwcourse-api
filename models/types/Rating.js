module.exports = (required_msg) => {
    return {
        type: Number,
        required: [true, required_msg],
        validate: {
            validator: Number.isInteger,
            message: 'Invalid value'
        },
        min: [0, 'Invalid value'],
        max: [5, 'Invalid value']
    };
};
