const Boom = require('boom');

function makeBoomOutput(boomMethod) {
    return message => JSON.stringify(Boom[boomMethod](message).output.payload);
}

Object.keys(Boom).forEach(key => exports[key] = makeBoomOutput(key));