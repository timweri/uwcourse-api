module.exports = (value, fieldName, queryObj, type = 'string') => {
    if (value) {
        const match = /^(\$(?:gte|lte|lt|gt))/.exec(value);
        if (match) {
            queryObj[fieldName] = {[match[0]]: parseInt(value.substring(match[0].length))};
        } else {
            if (type === 'int') {
                queryObj[fieldName] = parseInt(value);
            } else {
                queryObj[fieldName] = value;
            }
        }
    }
    return queryObj;
};
