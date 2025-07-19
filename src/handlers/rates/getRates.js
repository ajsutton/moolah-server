import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import session from '../../auth/session.js';

export default {
  auth: 'session',
  handler: async function (request, h) {
    const userId = session.getUserId(request);

    const currencies = request.query.currency.map(pair => {
      const [from, to] = pair.split('/');
      return { from, to };
    });
    const rates = await db.withTransaction(request, async daos => {
      return await daos.rates.getRates(
        userId,
        request.query.from,
        request.query.to,
        currencies
      );
    });
    return h.response(rates).code(200);
  },
  validate: {
    query: Joi.object({
      currency: Joi.array()
        .items(types.currencyPair)
        .min(1)
        .single(true)
        .required(),
      from: types.date.required(),
      to: types.date.required(),
    }),
  },
};
