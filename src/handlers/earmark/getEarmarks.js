import session from '../../auth/session.js';
import db from '../../db/database.js';
import loadEarmarkBalance from './loadEarmarkBalance.js';
import { Boom } from '@hapi/boom';

export default {
  auth: 'session',
  handler: async function (request) {
    try {
      const userId = session.getUserId(request);
      return await db.withTransaction(request, async daos => {
        const earmarks = await daos.earmarks.earmarks(userId);
        await Promise.all(
          earmarks.map(async earmark =>
            loadEarmarkBalance(userId, earmark, daos)
          )
        );
        return { earmarks: earmarks };
      });
    } catch (err) {
      throw Boom.internal('Error while accessing earmarks', err);
    }
  },
};
