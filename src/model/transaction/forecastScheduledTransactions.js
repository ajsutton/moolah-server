const parseDate = require('date-fns/parse');
const isAfter = require('date-fns/is_after');
const dateFormat = require('date-fns/format');
const dueDateTools = require('./nextDueDate');
const transactionComparator = require('./transactionComparator');

function extrapolateScheduledTransaction(transaction, forecastUntil) {
    if (transaction.recurPeriod === 'ONCE') {
        return isAfter(transaction.date, forecastUntil) ? [] : [transaction];
    }
    const instances = [];
    const dateStepFunction = dueDateTools.dateStepFunction(transaction.recurPeriod);
    let date = transaction.date;
    while (!isAfter(date, forecastUntil)) {
        instances.push(Object.assign({}, transaction, {date: dateFormat(date, 'YYYY-MM-DD')}));
        date = dateStepFunction(date, transaction.recurEvery);
    }
    return instances;
}

function extrapolateScheduledTransactions(scheduledTransactions, forecastUntil) {
    return scheduledTransactions.map(transaction => extrapolateScheduledTransaction(transaction, forecastUntil))
        .reduce((value, next) => [...next, ...value], [])
        .sort(transactionComparator);
}

module.exports = {
    extrapolateScheduledTransactions,
    forecastBalances(scheduledTransactions, currentNetWorth, currentEarmarks, until) {
        const forecastUntil = parseDate(until);
        const transactions = extrapolateScheduledTransactions(scheduledTransactions.filter(transaction => transaction.type !== 'transfer'), forecastUntil);
        const balances = {};
        let balance = currentNetWorth;
        let availableFunds = currentNetWorth - currentEarmarks;
        transactions.forEach(transaction => {
            balance += transaction.amount;
            if (!transaction.earmarkId) {
                availableFunds += transaction.amount;
            }
            balances[transaction.date] = {balance, availableFunds};
        });
        return Object.entries(balances).map(([date, data]) => ({date, balance: data.balance, availableFunds: data.availableFunds}));
    },
};