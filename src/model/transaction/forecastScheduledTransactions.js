const {parseDate} = require('date-fns/parse');
const {isAfter} = require('date-fns/isAfter');
const dateFormat = require('date-fns/format').format;
const dueDateTools = require('./nextDueDate');
const {parseISO} = require('date-fns/parseISO');
const transactionComparator = require('./transactionComparator');

function extrapolateScheduledTransaction(transaction, forecastUntil) {
    forecastUntil = typeof forecastUntil == 'string' ? parseISO(forecastUntil) : forecastUntil;
    if (transaction.recurPeriod === 'ONCE') {
        return isAfter(parseISO(transaction.date), forecastUntil) ? [] : [transaction];
    }
    const instances = [];
    const dateStepFunction = dueDateTools.dateStepFunction(transaction.recurPeriod);
    let date = parseISO(transaction.date);
    while (!isAfter(date, forecastUntil)) {
        instances.push(Object.assign({}, transaction, {date: dateFormat(date, 'yyyy-MM-dd')}));
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
        const forecastUntil = parseISO(until);
        const transactions = extrapolateScheduledTransactions(scheduledTransactions.filter(transaction => transaction.type !== 'transfer'), forecastUntil);
        const balances = {};
        let balance = currentNetWorth;
        let availableFunds = currentNetWorth - currentEarmarks;
        transactions.forEach(transaction => {
            balance += transaction.amount;
            if (!transaction.earmark) {
                availableFunds += transaction.amount;
            }
            balances[transaction.date] = {balance, availableFunds};
        });
        return Object.entries(balances).map(([date, data]) => ({date, balance: data.balance, availableFunds: data.availableFunds}));
    },
};