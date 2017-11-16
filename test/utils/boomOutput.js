const Boom = require('boom');

function makeBoomOutput(boomMethod) {
    return message => JSON.stringify(Boom[boomMethod](message).output.payload);
}

exports.badRequest = makeBoomOutput('badRequest');
exports.notFound = makeBoomOutput('notFound');