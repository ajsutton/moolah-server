import session from '../../auth/session.js';
import db from '../../db/database.js';
import types from '../types.js';
import Boom from '@hapi/boom';

export default {
  auth: 'session',
  handler: async function (request) {
    try {
      const userId = session.getUserId(request);
      return await db.withTransaction(request, async daos => {
        const account = await daos.accounts.account(userId, request.params.id);
        if (account === undefined) {
          throw Boom.notFound('Account not found');
        }
        const pageSize = request.query.pageSize;
        const offset = request.query.offset;
        const opts = {
          accountId: account.id,
          from: request.query.from,
          to: request.query.to,
        };
        if (pageSize !== undefined) {
          opts.pageSize = pageSize + 1;
        }
        if (offset !== undefined) {
          opts.offset = offset;
        }
        const values = await daos.investmentValue.getValues(userId, opts);
        return {
          values: values.slice(0, pageSize),
          hasMore: values.length > pageSize,
        };
      });
    } catch (err) {
      console.error('Error while accessing accounts', err);
      throw Boom.internal('Error while accessing accounts', err);
    }
  },
  validate: {
    params: {
      id: types.id.required(),
    },
    query: {
      from: types.date.default(() => undefined),
      to: types.date.default(() => undefined),
      pageSize: types.pageSize,
      offset: types.offset,
    },
    failAction: types.failAction,
  },
};
