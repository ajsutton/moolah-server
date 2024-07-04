import Boom from '@hapi/boom';
import db from '../../db/database.js';
import session from '../../auth/session.js';
import loadEarmarkBalance from './loadEarmarkBalance.js';

export default {
  auth: 'session',
  handler: async function (request) {
    const userId = session.getUserId(request);
    return await db.withTransaction(request, async daos => {
      const earmark = await daos.earmarks.earmark(userId, request.params.id);
      if (earmark === undefined) {
        throw Boom.notFound('Earmark not found');
      } else {
        await loadEarmarkBalance(userId, earmark, daos);
        return earmark;
      }
    });
  },
};
