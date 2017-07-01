const Boom = require('boom');

module.exports = {
    badRequest(message) {
        return JSON.stringify(Boom.badRequest(message).output.payload);
    },
};