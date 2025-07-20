import Boom from '@hapi/boom';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import loadEarmarkBalance from './loadEarmarkBalance.js';
import { DEFAULT_CURRENCY } from '../../utils/currency.js';
import types from '../types.js';

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      const earmark = await daos.earmarks.earmark(userId, request.params.id);
      if (earmark === undefined) {
        throw Boom.notFound('Earmark not found');
      } else {
        await loadEarmarkBalance(userId, earmark, daos, request.query.currency);
        return earmark;
      }
    });
  },
  validate: {
    query: {
      currency: types.currency.default(DEFAULT_CURRENCY),
    },
    failAction: types.failAction,
  },
};
