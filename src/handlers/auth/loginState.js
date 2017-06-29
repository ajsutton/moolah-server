module.exports = {
    auth: {
        strategy: 'session',
        mode: 'try',
    },
    handler: function(req, reply) {
        if (!req.auth.isAuthenticated) {
            reply({loggedIn: false});
        } else {
            const profile = req.auth.credentials;
            reply({loggedIn: true, profile});
        }
    },
};
