const Hapi = require('hapi');

exports.create = function() {
    return new Promise((resolve, reject) => {
        const server = new Hapi.Server();
        server.connection({port: 3000, host: 'localhost'});
        server.register([
            require('hapi-async-handler'),
            require('./plugins/good'),
            require('./plugins/router'),
            require('./auth/googleAuthPlugin')
        ], err => {
            if (err) {
                reject(err);
            } else {
                resolve(server);
            }
        });
    });
};