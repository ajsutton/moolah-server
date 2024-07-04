import Boom from '@hapi/boom';
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
    request.cookieAuth.set(session);
    return h.redirect('/');
  },
};
