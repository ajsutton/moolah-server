const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const addDays = require('date-fns/add_days');
const formatDate = require('date-fns/format');
const forecastScheduledTransactions = require('../../model/transaction/forecastScheduledTransactions');

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            const daos = db.daos(request);
            const after = request.query.after;
            let currentBalance = after === null ? 0 : await daos.transactions.balance(userId, undefined, {date: formatDate(addDays(after, 1), 'YYYY-MM-DD'), id: null});
            const results = await daos.analysis.dailyProfitAndLoss(userId, after);
            const balances = results.map(dailyProfit => {
                currentBalance += dailyProfit.profit;
                return {date: dailyProfit.date, balance: currentBalance}
            });
            let scheduledBalances = undefined;
            if (request.query.forecastUntil !== null) {
                const scheduledTransactions = await daos.transactions.transactions(userId, {scheduled: true, pageSize: undefined});
                scheduledBalances = forecastScheduledTransactions.forecastBalances(scheduledTransactions, currentBalance, request.query.forecastUntil);
            }
            reply({dailyBalances: balances, scheduledBalances});
        },
    },
    validate: {
        query: {
            after: types.date.default(null),
            forecastUntil: types.date.default(null),
        },
    },
};