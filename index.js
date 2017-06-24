const Hapi = require('hapi');
const Hoek = require('hoek');

const server = new Hapi.Server();
server.connection({port: 3000, host: 'localhost'});

server.register([
    require('./src/plugins/good'),
    require('./src/plugins/router'),
], err => {
    Hoek.assert(!err, err);
    server.start(err => {
        Hoek.assert(!err, err);

        server.log(`Server running at: ${server.info.uri}`);
    });
});