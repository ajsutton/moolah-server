const JWT = require('jsonwebtoken');
const authConfig = require('../../auth/authConfig');

function unauthenticated(req, reply) {
    reply({state: 'UNAUTHENTICATED', loginUrl: req.server.generate_google_oauth2_url()});
}

module.exports = {
    handler: function(req, reply) {
        try {
            console.log(req.state.token);
            const token = JWT.verify(req.state.token, authConfig.jwtSecret);
            if (token.userId) {
                reply({state: 'AUTHENTICATED', userId: token.userId, profile: {givenName: token.givenName, familyName: token.familyName}});
            } else {
                unauthenticated(req, reply);
            }
        } catch (error) {
            unauthenticated(req, reply);
        }
    },
};