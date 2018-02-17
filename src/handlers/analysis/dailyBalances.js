const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const addDays = require('date-fns/add_days');
const differenceInDays = require('date-fns/difference_in_days');
const formatDate = require('date-fns/format');
const forecastScheduledTransactions = require('../../model/transaction/forecastScheduledTransactions');
const regression = require('regression');

function dateToNumber(date) {
    return differenceInDays('1970-01-01', date);
}

module.exports = {
    auth: 'session',
    handler: {
        async: async function(request, reply) {
            const userId = session.getUserId(request);
            await db.withTransaction(request, async daos => {
                const after = request.query.after;
                let currentBalance = after === null ? 0 : await daos.transactions.balance(userId, {}, {date: formatDate(addDays(after, 1), 'YYYY-MM-DD'), id: null});
                let currentEarmarks = after === null ? 0 : await daos.transactions.balance(userId, {hasEarmark: true}, {date: formatDate(addDays(after, 1), 'YYYY-MM-DD'), id: null});
                console.log("Starting balance: " + currentBalance, "Starting earmark: " + currentEarmarks);
                const results = await daos.analysis.dailyProfitAndLoss(userId, after);
                const balances = results.map(dailyProfit => {
                    currentBalance += dailyProfit.profit;
                    currentEarmarks += dailyProfit.earmarked;
                    console.log(dailyProfit.date, " balance: " + currentBalance, "earmark: " + currentEarmarks);
                    return {date: dailyProfit.date, balance: currentBalance, availableFunds: currentBalance - currentEarmarks}
                });
                console.log("Final balance: " + currentBalance, "Final earmark: " + currentEarmarks);
                let scheduledBalances = undefined;
                if (request.query.forecastUntil !== null) {
                    const scheduledTransactions = await daos.transactions.transactions(userId, {scheduled: true, pageSize: undefined});
                    scheduledBalances = forecastScheduledTransactions.forecastBalances(scheduledTransactions, currentBalance, currentEarmarks, request.query.forecastUntil);
                }
                const balancesByTimestamp = balances.map(({date, balance}) => [dateToNumber(date), balance]);

                const bestFit = regression.linear(balancesByTimestamp);
                balances.forEach(balanceEntry => balanceEntry.bestFit = bestFit.predict(dateToNumber(balanceEntry.date))[1]);
                if (scheduledBalances) {
                    scheduledBalances.forEach(balanceEntry => balanceEntry.bestFit = bestFit.predict(dateToNumber(balanceEntry.date))[1]);
                }
                reply({dailyBalances: balances, scheduledBalances});
            });
        },
    },
    validate: {
        query: {
            after: types.date.default(null),
            forecastUntil: types.date.default(null),
        },
    },
};