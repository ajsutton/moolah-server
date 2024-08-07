import Joi from 'joi';
import types from '../types.js';
import db from '../../db/database.js';
import Boom from '@hapi/boom';
import session from '../../auth/session.js';

async function getParentIdRejectionReason(userId, daos, categoryId, parentId) {
  while (parentId !== null && parentId !== undefined) {
    const parentCategory = await daos.categories.category(userId, parentId);
    if (parentCategory === undefined) {
      return Boom.badRequest('Unknown parent category');
    } else if (parentCategory.id === categoryId) {
      return Boom.badRequest('Category can not be its own ancestor');
    }
    parentId = parentCategory.parentId;
  }
  return undefined;
}

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      const currentCategory = await daos.categories.category(
        userId,
        request.params.id
      );
      if (currentCategory === undefined) {
        throw Boom.notFound('Category not found');
      } else {
        const parentIdRejectionReason = await getParentIdRejectionReason(
          userId,
          daos,
          request.params.id,
          request.payload.parentId
        );
        if (parentIdRejectionReason !== undefined) {
          throw parentIdRejectionReason;
        } else {
          const modifiedCategory = Object.assign(
            {},
            currentCategory,
            request.payload
          );
          await daos.categories.store(userId, modifiedCategory);
          return modifiedCategory;
        }
      }
    });
  },
  validate: {
    params: {
      id: types.id.required(),
    },
    payload: Joi.object({
      id: types.id,
      name: types.name.required(),
      parentId: types.id.allow(null).default(null),
    }),
    headers: Joi.object({
      'Content-Type': types.jsonContentType,
    }).unknown(true),
    failAction: types.failAction,
  },
};
