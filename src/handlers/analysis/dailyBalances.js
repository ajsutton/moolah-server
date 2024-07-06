import types from '../types.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import {
  addDays,
  differenceInDays,
  format as formatDate,
  parseISO,
} from 'date-fns';
import forecastScheduledTransactions from '../../model/transaction/forecastScheduledTransactions.js';
import regression from 'regression';

function dateToNumber(date) {
  return differenceInDays(parseISO('1970-01-01'), parseISO(date));
}

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      const after = request.query.after ? parseISO(request.query.after) : null;
      let currentBalance =
        after === null
          ? 0
          : await daos.transactions.balance(
              userId,
              { hasCurrentAccount: true },
              { date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null }
            );
      let currentInvestments =
        after === null
          ? 0
          : await daos.transactions.balance(
              userId,
              { hasInvestmentAccount: true },
              { date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null }
            );
      let currentEarmarks =
        after === null
          ? 0
          : await daos.transactions.balance(
              userId,
              { hasEarmark: true },
              { date: formatDate(addDays(after, 1), 'yyyy-MM-dd'), id: null }
            );
      const results = await daos.analysis.dailyProfitAndLoss(
        userId,
        after ? formatDate(after, 'yyyy-MM-dd') : null
      );
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
      const balancesByTimestamp = Object.values(balances).map(
        ({ date, availableFunds }) => [dateToNumber(date), availableFunds]
      );

      const investmentDeltas = await daos.investmentValue.getCombinedValues(
        userId,
        after ? { from: formatDate(addDays(after, 1), 'yyyy-MM-dd') } : {}
      );

      let currentInvestmentValue = undefined;
      investmentDeltas.forEach(entry => {
        currentInvestmentValue =
          currentInvestmentValue == undefined
            ? entry.delta
            : currentInvestmentValue + entry.delta;
        const balance = balances[entry.date] || { date: entry.date };
        balance.investmentValue = currentInvestmentValue;
        balances[entry.date] = balance;
      });

      let scheduledBalances = undefined;
      if (request.query.forecastUntil !== undefined) {
        const scheduledTransactions = await daos.transactions.transactions(
          userId,
          { scheduled: true, pageSize: undefined }
        );
        scheduledBalances = forecastScheduledTransactions.forecastBalances(
          scheduledTransactions,
          currentBalance,
          currentEarmarks,
          request.query.forecastUntil
        );
      }

      const bestFit = regression.linear(balancesByTimestamp);
      const balancesList = Object.values(balances);
      if (investmentDeltas.length > 0) {
        for (let i = 0; i < balancesList.length; i++) {
          const entry = balancesList[i];
          if (i != 0 && !entry.investmentValue) {
            entry.investmentValue =
              balancesList[i - 1].investmentValue ||
              balancesList[i - 1].investments ||
              0;
          } else if (!entry.investmentValue) {
            entry.investmentValue = entry.investments;
          }
          if (i != 0 && !entry.balance) {
            Object.assign(entry, balancesList[i - 1], {
              investmentValue: entry.investmentValue,
            });
          } else if (!entry.balance) {
            Object.assign(entry, {
              balance: 0,
              earmarked: 0,
              availableFunds: 0,
              investments: 0,
            });
          }
          entry.netWorth = entry.balance + entry.investmentValue;
        }
      }
      balancesList.forEach(
        balanceEntry =>
          (balanceEntry.bestFit = bestFit.predict(
            dateToNumber(balanceEntry.date)
          )[1])
      );
      if (scheduledBalances) {
        scheduledBalances.forEach(
          balanceEntry =>
            (balanceEntry.bestFit = bestFit.predict(
              dateToNumber(balanceEntry.date)
            )[1])
        );
      }
      return { dailyBalances: balancesList, scheduledBalances };
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
