export function override(object, overrides) {
  return withoutValues(
    Object.assign({}, object, withoutUndefined(overrides)),
    null
  );
}

export function withoutUndefined(object) {
  return withoutValues(object, undefined);
}

export function withoutValues(object, disallowedValue) {
  const result = {};
  Object.entries(object)
    .filter(([, value]) => value !== disallowedValue)
    .forEach(([key, value]) => (result[key] = value));
  return result;
}

export function lookupId(alias, aliasToObjectMap) {
  if (alias === undefined || alias === null) {
    return alias;
  } else if (alias.startsWith('<') && alias.endsWith('>')) {
    return alias.substring(1, alias.length - 1);
  } else {
    return aliasToObjectMap.get(alias).id;
  }
}

export function formatQueryArgs(args) {
  const query = Object.entries(args)
    .filter(([, value]) => value !== undefined)
    .map(formatQueryArg)
    .join('&');
  return query !== '' ? '?' + query : '';
}

export function formatQueryArg([key, value]) {
  if (value instanceof Array) {
    return value
      .map(
        singleValue =>
          encodeURIComponent(key) + '=' + encodeURIComponent(singleValue)
      )
      .join('&');
  }
  return encodeURIComponent(key) + '=' + encodeURIComponent(value);
}

export default {
  withoutUndefined,
  override,
  lookupId,
  formatQueryArgs,
};
