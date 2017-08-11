const parseDate = require('date-fns/parse');
const isAfter = require('date-fns/is_after');
const dateFormat = require('date-fns/format');
const dueDateTools = require('./nextDueDate');
const transactionComparator = require('./transactionComparator');

function extrapolateScheduledTransaction(transaction, forecastUntil) {
    if (transaction.recurPeriod === 'ONCE') {
        return [transaction];
    }
    const instances = [];
    const dateStepFunction = dueDateTools.dateStepFunction(transaction.recurPeriod);
    let date = transaction.date;
    do {
        instances.push(Object.assign({}, transaction, {date: dateFormat(date, 'YYYY-MM-DD')}));
        date = dateStepFunction(date, transaction.recurEvery);
    } while (!isAfter(date, forecastUntil));
    return instances;
}

function extrapolateScheduledTransactions(scheduledTransactions, forecastUntil) {
    return scheduledTransactions.map(transaction => extrapolateScheduledTransaction(transaction, forecastUntil))
        .reduce((value, next) => [...next, ...value], [])
        .sort(transactionComparator);
}

module.exports = {
    extrapolateScheduledTransactions,
    forecastBalances(scheduledTransactions, currentNetWorth, until) {
        const forecastUntil = parseDate(until);
        const transactions = extrapolateScheduledTransactions(scheduledTransactions.filter(transaction => transaction.type !== 'transfer'), forecastUntil);
        const balances = {};
        let balance = currentNetWorth;
        transactions.forEach(transaction => {
            balance += transaction.amount;
            balances[transaction.date] = balance;
        });
        return Object.entries(balances).map(([date, balance]) => ({date, balance}));
    },
};