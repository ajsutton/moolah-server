import db from '../../db/database.js';
import session from '../../auth/session.js';
import transactionSearchOptions from '../transactionSearchOptions.js';
import Boom from '@hapi/boom';
import types from '../types.js';

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      try {
        const searchOptions = await transactionSearchOptions.parseOptions(
          request,
          daos
        );
        return await daos.transactions.balanceByCategory(userId, searchOptions);
      } catch (errorMessage) {
        throw Boom.notFound(errorMessage);
      }
    });
  },
  validate: {
    query: transactionSearchOptions.queryValidation,
    failAction: types.failAction,
  },
};
