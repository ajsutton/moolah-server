const session = require('../../auth/session');
const db = require('../../db/database');
const loadEarmarkBalance = require('./loadEarmarkBalance');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            try {
                const userId = session.getUserId(request);
                await db.withTransaction(request, async daos => {
                    const earmarks = await daos.earmarks.earmarks(userId);
                    await Promise.all(earmarks.map(async earmark => loadEarmarkBalance(userId, earmark, daos)));
                    reply({earmarks: earmarks});
                });
            } catch (err) {
                console.error('Error while accessing earmarks', err);
                reply(err, 500);
            }
        },
    },
};