import types from '../types.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      const results = await daos.analysis.incomeAndExpense(
        userId,
        request.query.monthEnd,
        request.query.after
      );
      return { incomeAndExpense: results };
    });
  },
  validate: {
    query: {
      after: types.date.default(null),
      monthEnd: types.monthEnd.required(),
    },
    failAction: types.failAction,
  },
};
