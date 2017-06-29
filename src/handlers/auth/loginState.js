
function unauthenticated(req, reply) {
    reply({state: 'UNAUTHENTICATED', loginUrl: req.server.generate_google_oauth2_url()});
}

module.exports = {
    auth: {
        strategy: 'session',
        mode: 'try',
    },
    handler: function(req, reply) {
        if (!req.auth.isAuthenticated) {
            reply({state: 'UNAUTHENTICATED', loginUrl: '/googleauth'});
        } else {
            const token = req.auth.credentials;
            reply({state: 'AUTHENTICATED', userId: token.userId, profile: {givenName: token.givenName, familyName: token.familyName}});
        }
    },
};