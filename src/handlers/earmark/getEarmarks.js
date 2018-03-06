const session = require('../../auth/session');
const db = require('../../db/database');
const loadEarmarkBalance = require('./loadEarmarkBalance');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        try {
            const userId = session.getUserId(request);
            return await db.withTransaction(request, async daos => {
                const earmarks = await daos.earmarks.earmarks(userId);
                await Promise.all(earmarks.map(async earmark => loadEarmarkBalance(userId, earmark, daos)));
                return {earmarks: earmarks};
            });
        } catch (err) {
            throw Boom.internal('Error while accessing earmarks', err);
        }
    },
};