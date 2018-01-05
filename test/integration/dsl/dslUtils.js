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

function formatQueryArgs(args) {
    const query = Object.entries(args)
        .filter(([key, value]) => value !== undefined)
        .map(formatQueryArg)
        .join('&');
    return query !== '' ? '?' + query : '';
}

function formatQueryArg([key, value]) {
    if (value instanceof Array) {
        return value.map(singleValue => encodeURIComponent(key) + '=' + encodeURIComponent(singleValue)).join('&');
    }
    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
}

module.exports = {
    withoutUndefined,
    override,
    lookupId,
    formatQueryArgs
};