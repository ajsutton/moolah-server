import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import Boom from '@hapi/boom';

export default {
  auth: 'session',
  handler: async function (request, h) {
    const userId = session.getUserId(request);
    const { from, to, date, rate } = request.payload;

    if (from === to) {
      return Boom.badRequest('from and to currencies cannot be the same');
    }

    await db.withTransaction(request, async daos => {
      await daos.rates.setRate(userId, date, from, to, rate);
    });

    return h.response().code(201);
  },
  validate: {
    payload: Joi.object({
      from: types.currency.required(),
      to: types.currency.required(),
      date: types.date.required(),
      rate: types.rate.required(),
    }),
  },
};
