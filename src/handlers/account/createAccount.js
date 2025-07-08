import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import idGenerator from '../../utils/idGenerator.js';
import session from '../../auth/session.js';
import Boom from '@hapi/boom';

export default {
  auth: 'session',
  handler: async function (request, h) {
    while (true) {
      try {
        const account = Object.assign({ id: idGenerator() }, request.payload, {
          hidden: false,
          currency: 'AUD',
        });
        const userId = session.getUserId(request);
        await db.withTransaction(request, async daos => {
          if (account.parentId !== undefined && account.parentId !== null) {
            const parentAccount = await daos.accounts.account(
              userId,
              account.parentId
            );
            if (parentAccount === undefined) {
              throw Boom.badRequest('ParentId not found');
            }
          }
          await daos.accounts.create(userId, {
            id: account.id,
            name: account.name,
            type: account.type,
            parentId: account.parentId,
          });
          await daos.transactions.create(userId, {
            id: account.id,
            accountId: account.id,
            type: 'openingBalance',
            date:
              account.date !== undefined && account.date !== null
                ? account.date
                : new Date(),
            amount: account.balance,
          });
        });
        delete account.date;
        return h
          .response(account)
          .created(`/accounts/${encodeURIComponent(account.id)}/`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
      }
    }
  },
  validate: {
    payload: Joi.object({
      name: types.name.required(),
      type: types.accountType.required(),
      balance: types.money.required(),
      position: types.position,
      currency: types.currency,
      date: types.date.default(null),
      parentId: types.id,
    }),
    headers: Joi.object({
      'Content-Type': types.jsonContentType,
    }).unknown(true),
    failAction: types.failAction,
  },
};
