import Boom from '@hapi/boom';
import codeStore from '../../auth/codeStore.js';

export default {
  auth: false,
  handler: function (request) {
    const code = request.payload?.code;
    if (!code) {
      throw Boom.badRequest('Missing code');
    }
    const session = codeStore.exchange(code);
    if (!session) {
      // Not ready yet (OAuth still in progress) or expired.
      // The native app polls this endpoint, so return a non-error response.
      return { loggedIn: false };
    }
    request.cookieAuth.set(session);
    return { loggedIn: true, profile: session };
  },
};
