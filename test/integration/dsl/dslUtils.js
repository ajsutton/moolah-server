function override(object, overrides) {
    return withoutValues(Object.assign({}, object, withoutUndefined(overrides)), null);
}

function withoutUndefined(object) {
    return withoutValues(object, undefined);
    const result = {};
    Object.entries(object)
        .filter(([key, value]) => value !== undefined)
        .forEach(([key, value]) => result[key] = value);
    return result;
}

function withoutValues(object, disallowedValue) {
    const result = {};
    Object.entries(object)
        .filter(([key, value]) => value !== disallowedValue)
        .forEach(([key, value]) => result[key] = value);
    return result;
}

function lookupId(alias, aliasToObjectMap) {
    if (alias === undefined || alias === null) {
        return alias;
    } else if (alias.startsWith('<') && alias.endsWith('>')) {
        return alias.substring(1, alias.length - 1);
    } else {
        return aliasToObjectMap.get(alias).id;
    }
}

module.exports = {
    withoutUndefined,
    override,
    lookupId
};