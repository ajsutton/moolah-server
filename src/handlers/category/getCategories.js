const db = require('../../db/database');
const session = require('../../auth/session');
const Boom = require('boom');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const daos = db.daos(request);
            const categories = await daos.categories.categories(userId);
            reply({
                categories
            });
        },
    },
};