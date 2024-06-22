const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const { addDays } = require('date-fns/addDays');
const formatDate = require('date-fns/format').format;
const { parseISO } = require('date-fns/parseISO');

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        const accountId = request.params.id;
        return await db.withTransaction(request, async daos => {
            const after = request.query.after ? parseISO(request.query.after) : null;
            let currentBalance = after === null ? 0 : await daos.transactions.balance(userId, {accountId}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            const results = await daos.transactions.dailyBalanceChange(userId,{accountId, after: after ? formatDate(after, 'yyyy-MM-dd') : null});
            return results.map(dailyProfit => {
                currentBalance += dailyProfit.profit;
                return {date: dailyProfit.date, balance: currentBalance};
            });
        });
    },
    validate: {
        query: {
            after: types.date.default(null),
        },
        failAction: types.failAction,
    },
};