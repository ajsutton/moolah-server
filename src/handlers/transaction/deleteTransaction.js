import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import Boom from '@hapi/boom';
import session from '../../auth/session.js';

export default {
  auth: 'session',
  handler: async function (request, h) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      const transactionId = request.params.id;
      const transaction = await daos.transactions.transaction(
        userId,
        transactionId
      );
      if (transaction === undefined) {
        throw Boom.notFound('Transaction not found');
      } else {
        await daos.transactions.delete(userId, transactionId);
        return h.response().code(204);
      }
    });
  },
  validate: {
    params: {
      id: types.id.required(),
    },
    headers: Joi.object({
      'Content-Type': types.jsonContentType,
    }).unknown(true),
    failAction: types.failAction,
  },
};
