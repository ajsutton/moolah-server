const Hapi = require('hapi');
const Good = require('good');
const Hoek = require('hoek');

const server = new Hapi.Server();
server.connection({port: 3000, host: 'localhost'});

server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => {
        reply('Hello, world!');
    },
});

server.register({
    register: Good,
    options: {
        reporters: {
            console: [
                {
                    module: 'good-squeeze',
                    name: 'Squeeze',
                    args: [{
                        response: '*',
                        log: '*',
                    }],
                },
                {
                    module: 'good-console',
                },
                'stdout',
            ],
        },
    },
}, err => {
    Hoek.assert(!err, err);
    server.start(err => {
        Hoek.assert(!err, err);

        server.log(`Server running at: ${server.info.uri}`);
    });
});