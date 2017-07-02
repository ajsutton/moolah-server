exports.override = function(object, overrides) {
    const result = Object.assign({}, object);
    Object.entries(overrides)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => result[key] = value);
    return result;
};