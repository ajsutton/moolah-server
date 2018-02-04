const Boom = require('boom')
const db = require('../../db/database');
const session = require('../../auth/session');
const loadEarmarkBalance = require('./loadEarmarkBalance');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const earmark = await daos.earmarks.earmark(userId, request.params.id);
                if (earmark === undefined) {
                    reply(Boom.notFound('Earmark not found'));
                } else {
                    await loadEarmarkBalance(userId, earmark, daos);
                    reply(earmark);
                }
            });
        },
    },
};