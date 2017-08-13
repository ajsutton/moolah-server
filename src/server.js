const env = require('get-env')();
const Hapi = require('hapi');
const configue = require('./config');

exports.create = function() {
    return new Promise((resolve, reject) => {
        const server = new Hapi.Server();
        server.connection({port: 3000, host: 'localhost'});
        server.register([configue.plugin()], configErr => {
            if (configErr) {
                reject(configErr);
            } else {
                const authConfig = server.configue('authentication');
                server.register([
                    require('hapi-async-handler'),
                    require('./plugins/good'),
                    require('./plugins/database')(server),
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
            }
        });
    });
};
