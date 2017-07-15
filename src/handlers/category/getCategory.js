const Boom = require('boom')
const db = require('../../db/database');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const daos = db.daos(request);
            const category = await daos.categories.category(userId, request.params.id);
            if (category === undefined) {
                reply(Boom.notFound('Category not found'));
            } else {
                reply(category);
            }
        },
    },
};