const session = require('../../auth/session');

function unauthenticated(req, reply) {
    reply({state: 'UNAUTHENTICATED', loginUrl: req.server.generate_google_oauth2_url()});
}

module.exports = {
    handler: function(req, reply) {
        const user = session.getUser();
        if (user !== null) {
            reply({state: 'AUTHENTICATED', userId: token.userId, profile: {givenName: token.givenName, familyName: token.familyName}});
        } else {
            unauthenticated(req, reply);
        }
    },
};