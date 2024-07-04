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
      const account = await daos.accounts.account(userId, request.params.id);
      if (account === undefined) {
        throw Boom.notFound('Account not found');
      }
      const value = request.payload;
      await daos.investmentValue.setValue(
        userId,
        account.id,
        request.params.date,
        value
      );
      return h
        .response()
        .created(
          `/accounts/${encodeURIComponent(account.id)}/values/${encodeURIComponent(request.params.date)}`
        );
    });
  },
  validate: {
    params: {
      id: types.id.required(),
      date: types.date.required(),
    },
    payload: types.money.required(),
    headers: Joi.object({
      'Content-Type': types.jsonContentType,
    }).unknown(true),
    failAction: types.failAction,
  },
};
