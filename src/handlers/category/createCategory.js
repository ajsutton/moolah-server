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
        const category = Object.assign({ id: idGenerator() }, request.payload);
        const userId = session.getUserId(request);
        return await db.withTransaction(request, async daos => {
          if (
            category.parentId !== undefined &&
            (await daos.categories.category(userId, category.parentId)) ===
              undefined
          ) {
            throw Boom.badRequest('Unknown parent category', category.parentId);
          }
          await daos.categories.create(userId, category);
          return h
            .response(category)
            .created(`/categories/${encodeURIComponent(category.id)}/`);
        });
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
      parentId: types.id,
    }),
    headers: Joi.object({
      'Content-Type': types.jsonContentType,
    }).unknown(true),
    failAction: types.failAction,
  },
};
