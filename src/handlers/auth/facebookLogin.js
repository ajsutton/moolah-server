const Boom = require('@hapi/boom');
module.exports = {
    auth: {
        strategy: 'facebook',
        mode: 'try',
    },
    handler: function(request, h) {
        if (!request.auth.isAuthenticated) {
            throw Boom.unauthorized('Authentication failed: ' + request.auth.error.message);
        }
        const profile = request.auth.credentials.profile;
        const session = {
            userId: `facebook-${profile.id}`,
            name: profile.displayName,
            givenName: profile.name.first,
            familyName: profile.name.last,
            picture: profile.raw.picture.data.url,
        };
        request.cookieAuth.set(session);
        return h.redirect('/');
    },
};