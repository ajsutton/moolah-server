const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');

function dateToNumber(date) {
    return differenceInDays('1970-01-01', date);
}

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const results = await daos.analysis.expenseBreakdown(userId, request.query.monthEnd, request.query.after);
                reply(results);
            });
        },
    },
    validate: {
        query: {
            after: types.date.default(null),
            monthEnd: types.monthEnd.required(),
        },
    },
};