function override(object, overrides) {
    return  Object.assign({}, object, withoutUndefined(overrides));
}

function withoutUndefined(object) {
    const result = {};
    Object.entries(object)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => result[key] = value);
    return result;
}

module.exports = {
    withoutUndefined,
    override
};