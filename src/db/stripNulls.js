module.exports = function stripNulls(object) {
    if (object === undefined) {
        return object;
    }
    const result = {};
    Object.entries(object).forEach(([key, value]) => {
        if (value !== null) {
            result[key] = value;
        }
    });
    return result;
}