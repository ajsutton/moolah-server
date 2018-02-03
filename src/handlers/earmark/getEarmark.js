const Boom = require('boom')
const db = require('../../db/database');
const session = require('../../auth/session');

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
                    earmark.balance = await daos.transactions.balance(userId, {earmarkId: earmark.id});
                    reply(earmark);
                }
            });
        },
    },
};