module.exports = {
    auth: {
        strategy: 'session',
        mode: 'try',
    },
    handler: function(req, reply) {
        if (!req.auth.isAuthenticated) {
            reply({loggedIn: false, loginUrl: '/googleauth'});
        } else {
            const token = req.auth.credentials;
            reply({loggedIn: true, userId: token.userId, profile: {givenName: token.givenName, familyName: token.familyName}});
        }
    },
};
