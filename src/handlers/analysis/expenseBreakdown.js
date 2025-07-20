import types from '../types.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import { DEFAULT_CURRENCY } from '../../utils/currency.js';

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      return await daos.analysis.expenseBreakdown(
        userId,
        request.query.monthEnd,
        request.query.after,
        request.query.currency
      );
    });
  },
  validate: {
    query: {
      after: types.date.default(null),
      monthEnd: types.monthEnd.required(),
      currency: types.currency.default(DEFAULT_CURRENCY),
    },
    failAction: types.failAction,
  },
};
