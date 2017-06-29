const env = require('get-env')();
const Hapi = require('hapi');
const Boom = require('boom');
const authConfig = require('./auth/authConfig');
exports.create = function() {
    return new Promise((resolve, reject) => {
        const server = new Hapi.Server();
        server.connection({port: 3000, host: 'localhost'});
        server.register([
            require('hapi-async-handler'),
            require('./plugins/good'),
            require('hapi-auth-cookie'),
            require('bell'),
        ], err => {
            if (err) {
                reject(err);
            } else {
                server.auth.strategy('session', 'cookie', {
                    password: authConfig.secureToken,
                    isSecure: env === 'prod',
                });
                server.auth.strategy('google', 'bell', {
                    provider: 'google',
                    password: authConfig.secureToken,
                    isSecure: env === 'prod',
                    clientId: authConfig.googleClientId,
                    clientSecret: authConfig.clientSecret,
                    location: authConfig.baseUrl,
                });
                server.register([
                    require('./plugins/router'),
                ], err2 => {
                    if (err2) {
                        reject(err2);
                    } else {
                        resolve(server);
                    }
                });
            }
        });
    });
};
