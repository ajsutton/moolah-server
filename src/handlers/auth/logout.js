module.exports = {
    auth: {
        strategy: 'session',
        mode: 'try',
    },
    handler: function(request, reply) {
        request.cookieAuth.clear();
        reply({loggedIn: false});
    },
};