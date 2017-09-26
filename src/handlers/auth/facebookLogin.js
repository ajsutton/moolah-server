const Boom = require('boom');
module.exports = {
    auth: {
        strategy: 'facebook',
        mode: 'try',
    },
    handler: function(request, reply) {
        if (!request.auth.isAuthenticated) {
            return reply(Boom.unauthorized('Authentication failed: ' + request.auth.error.message));
        }
        const profile = request.auth.credentials.profile;
        const session = {
            userId: `facebook-${profile.id}`,
            name: profile.displayName,
            givenName: profile.name.given_name,
            familyName: profile.name.family_name,
            picture: profile.raw.picture,
        };
        request.cookieAuth.set(session);
        reply.redirect('/');
    },
};