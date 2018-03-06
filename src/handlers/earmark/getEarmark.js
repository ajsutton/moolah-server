const Boom = require('boom');
const db = require('../../db/database');
const session = require('../../auth/session');
const loadEarmarkBalance = require('./loadEarmarkBalance');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const earmark = await daos.earmarks.earmark(userId, request.params.id);
            if (earmark === undefined) {
                throw Boom.notFound('Earmark not found');
            } else {
                await loadEarmarkBalance(userId, earmark, daos);
                return earmark;
            }
        });
    },
};