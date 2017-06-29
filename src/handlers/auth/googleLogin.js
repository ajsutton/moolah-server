module.exports = {
    auth: {
        strategy: 'google',
        mode: 'try',
    },
    handler: function(request, reply) {
        if (!request.auth.isAuthenticated) {
            return reply(Boom.unauthorized('Authentication failed: ' + request.auth.error.message));
        }
        const profile = request.auth.credentials.profile;
        const session = {
            givenName: profile.name.given_name,
            familyName: profile.name.family_name,
            userId: profile.id,
        };
        request.cookieAuth.set(session);
        reply.redirect('/');
    },
};