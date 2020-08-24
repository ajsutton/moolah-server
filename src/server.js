const Hapi = require('@hapi/hapi');
const configue = require('./config');

exports.create = async function() {
    const server = new Hapi.Server({port: 3000, host: 'localhost'});
    await server.register(configue.plugin17());
    await require('./plugins/securityHeaders')(server);

    const authConfig = server.configue('authentication');
    await server.register([
        require('./plugins/good')(server),
        require('./plugins/database')(server),
        require('@hapi/cookie'),
        require('@hapi/bell'),
    ]);

    // Work around for https://github.com/midnightcodr/hapi-mysql2/pull/1 until it gets merged and a new version published
    server.events.on('stop', () => {
        try {
            server.mysql.pool.end();
        } catch (err) {
            server.log(['moolah', 'error'], 'Failed to shutdown database connection pool: ' + err.message, err);
        }
    });

    server.auth.strategy('session', 'cookie', {
        cookie: {
            password: authConfig.secureToken,
            isSecure: server.configue('https')
        }
    });
    server.auth.strategy('google', 'bell', {
        provider: 'google',
        password: authConfig.secureToken,
        isSecure: server.configue('https'),
        clientId: authConfig.googleClientId,
        clientSecret: authConfig.clientSecret,
        location: authConfig.baseUrl,
        scope: ['profile'],
    });

    await server.register([require('./plugins/router')]);

    return server;
};
