const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const addDays = require('date-fns/addDays');
const differenceInDays = require('date-fns/differenceInDays');
const formatDate = require('date-fns/format');
const parseISO = require('date-fns/parseISO');
const forecastScheduledTransactions = require('../../model/transaction/forecastScheduledTransactions');
const regression = require('regression');

function dateToNumber(date) {
    return differenceInDays(parseISO('1970-01-01'), parseISO(date));
}

module.exports = {
    auth: 'session',
    handler: async function(request) {
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
            const after = request.query.after ? parseISO(request.query.after) : null;
            let currentBalance = after === null ? 0 : await daos.transactions.balance(userId, {hasAccount: true}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            let currentEarmarks = after === null ? 0 : await daos.transactions.balance(userId, {hasEarmark: true}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            const results = await daos.analysis.dailyProfitAndLoss(userId, after ? formatDate(after, 'yyyy-MM-dd') : null);
            const balances = results.map(dailyProfit => {
                currentBalance += dailyProfit.profit;
                currentEarmarks += dailyProfit.earmarked;
                return {date: dailyProfit.date, balance: currentBalance, availableFunds: currentBalance - currentEarmarks};
            });
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
            return {dailyBalances: balances, scheduledBalances};
        });
    },
    validate: {
        query: {
            after: types.date.default(null),
            forecastUntil: types.date.default(null),
        },
        failAction: types.failAction,
    },
};