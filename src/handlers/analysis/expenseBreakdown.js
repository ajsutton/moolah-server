const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            return await daos.analysis.expenseBreakdown(userId, request.query.monthEnd, request.query.after);
        });
    },
    validate: {
        query: {
            after: types.date.default(null),
            monthEnd: types.monthEnd.required(),
        },
        failAction: types.failAction,
    },
};