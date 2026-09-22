const parseId = (value) => {
    if (value === null || value === undefined || typeof value === 'boolean') {
        return null;
    }
    const num = Number(value);
    return (!isNaN(num) && Number.isInteger(num) && num > 0) ? num : null;
};


module.exports = {
    parseId
};
