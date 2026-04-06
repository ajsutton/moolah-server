import Boom from '@hapi/boom';
import codeStore from '../../auth/codeStore.js';

export default {
  auth: {
    strategy: 'google',
    mode: 'try',
  },
  handler: function (request, h) {
    if (!request.auth.isAuthenticated) {
      throw Boom.unauthorized(
        'Authentication failed: ' + request.auth.error.message
      );
    }
    const profile = request.auth.credentials.profile;
    const session = {
      userId: `google-${profile.id}`,
      name: profile.displayName,
      givenName: profile.name.given_name,
      familyName: profile.name.family_name,
      picture: profile.raw.picture,
    };

    const query = request.auth.credentials.query ?? {};
    if (query._native) {
      // Native apps pass a nonce that identifies the sign-in attempt.
      // Store the session under that nonce so the app can poll for it
      // via POST /api/auth/token, avoiding any URL-scheme redirect.
      const nonce = query._nonce;
      if (!nonce) {
        throw Boom.badRequest('Missing _nonce parameter for native sign-in');
      }
      codeStore.store(nonce, session);
      return h
        .response(
          '<html><body style="font-family:system-ui;text-align:center;padding:4rem">' +
            '<h1>Sign\u2011in complete</h1>' +
            '<p>You can close this tab and return to Moolah.</p>' +
            '</body></html>'
        )
        .type('text/html');
    }

    request.cookieAuth.set(session);
    return h.redirect('/');
  },
};
