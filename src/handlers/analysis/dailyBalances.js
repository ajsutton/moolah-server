const types = require('../types');
const db = require('../../db/database');
const session = require('../../auth/session');
const { addDays } = require('date-fns/addDays');
const { differenceInDays } = require('date-fns/differenceInDays');
const formatDate = require('date-fns/format').format;
const { parseISO } = require('date-fns/parseISO');
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
            let currentBalance = after === null ? 0 : await daos.transactions.balance(userId, {hasCurrentAccount: true}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            let currentInvestments = after === null ? 0 : await daos.transactions.balance(userId, {hasInvestmentAccount: true}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            let currentEarmarks = after === null ? 0 : await daos.transactions.balance(userId, {hasEarmark: true}, {date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null});
            const results = await daos.analysis.dailyProfitAndLoss(userId, after ? formatDate(after, 'yyyy-MM-dd') : null);
            const balances = {};
            results.forEach(dailyProfit => {
                currentBalance += dailyProfit.profit;
                currentEarmarks += dailyProfit.earmarked;
                currentInvestments += dailyProfit.investments;
                balances[dailyProfit.date] = {
                    date: dailyProfit.date,
                    balance: currentBalance,
                    earmarked: currentEarmarks,
                    availableFunds: currentBalance - currentEarmarks,
                    investments: currentInvestments,
                    netWorth: currentBalance + currentInvestments,
                };
            });
            const balancesByTimestamp = Object.values(balances).map(({date, balance}) => [dateToNumber(date), balance]);

            const investmentDeltas = await daos.investmentValue.getCombinedValues(userId, after ? {from: formatDate(addDays(after, 1), 'yyyy-MM-dd')} : {});
            
            let currentInvestmentValue = undefined;
            const investmentValues = investmentDeltas.forEach(entry => {
                currentInvestmentValue = currentInvestmentValue == undefined ? entry.delta : currentInvestmentValue + entry.delta;
                balance = balances[entry.date] || { date: entry.date }
                balance.investmentValue = currentInvestmentValue;
                balances[entry.date] = balance;
            });

            let scheduledBalances = undefined;
            console.log("ForecastUntil", request.query.forecastUntil)
            if (request.query.forecastUntil !== undefined) {
                const scheduledTransactions = await daos.transactions.transactions(userId, {scheduled: true, pageSize: undefined});
                scheduledBalances = forecastScheduledTransactions.forecastBalances(scheduledTransactions, currentBalance, currentEarmarks, request.query.forecastUntil);
            }

            const bestFit = regression.linear(balancesByTimestamp);
            const balancesList = Object.values(balances);
            if (investmentDeltas.length > 0) {
                for (let i = 0; i < balancesList.length; i++) {
                    entry = balancesList[i];
                    if (i != 0 && !entry.investmentValue) {
                        entry.investmentValue = balancesList[i - 1].investmentValue || balancesList[i - 1].investments || 0;
                    } else if (!entry.investmentValue) {
                        entry.investmentValue = entry.investments;
                    }
                    if (i != 0 && !entry.balance) {
                        Object.assign(entry, balancesList[i - 1], {investmentValue: entry.investmentValue})
                    } else if (!entry.balance) {
                        Object.assign(entry, {balance: 0, earmarked: 0, availableFunds: 0, investments: 0})
                    }
                    entry.netWorth = entry.balance + entry.investmentValue;
                }
            }
            balancesList.forEach(balanceEntry => balanceEntry.bestFit = bestFit.predict(dateToNumber(balanceEntry.date))[1]);
            if (scheduledBalances) {
                scheduledBalances.forEach(balanceEntry => balanceEntry.bestFit = bestFit.predict(dateToNumber(balanceEntry.date))[1]);
            }
            return {dailyBalances: balancesList, scheduledBalances};
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