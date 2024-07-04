import {isAfter, format as dateFormat, parseISO} from 'date-fns';
import {dateStepFunction} from './nextDueDate.js';
import transactionComparator from './transactionComparator.js';

function extrapolateScheduledTransaction(transaction, forecastUntil) {
    forecastUntil = typeof forecastUntil == 'string' ? parseISO(forecastUntil) : forecastUntil;
    if (transaction.recurPeriod === 'ONCE') {
        return isAfter(parseISO(transaction.date), forecastUntil) ? [] : [transaction];
    }
    const instances = [];
    const dateStepFn = dateStepFunction(transaction.recurPeriod);
    let date = parseISO(transaction.date);
    while (!isAfter(date, forecastUntil)) {
        instances.push(Object.assign({}, transaction, {date: dateFormat(date, 'yyyy-MM-dd')}));
        date = dateStepFn(date, transaction.recurEvery);
    }
    return instances;
}

function extrapolateScheduledTransactions(scheduledTransactions, forecastUntil) {
    return scheduledTransactions.map(transaction => extrapolateScheduledTransaction(transaction, forecastUntil))
        .reduce((value, next) => [...next, ...value], [])
        .sort(transactionComparator);
}

export default {
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