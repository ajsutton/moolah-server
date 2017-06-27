const serverFactory = require('../../../src/server');
const AccountsDsl = require('./accountDsl');

class Server {
    constructor(hapiServer) {
        this.hapiServer = hapiServer;
    }

    post(url, payload) {
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({url: url, method: 'POST', payload: payload}, function(response) {
                resolve(response);
            });
        });
    }

    get(url) {
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({url: url, method: 'GET'}, function(response) {
                resolve(response);
            });
        });
    }

    stop() {
        this.hapiServer.stop();
    }
}

class Dsl {
    constructor(server) {
        this.server = server;
        this.accounts = new AccountsDsl(server);
    }

    tearDown() {
        this.server.stop();
    }

    static async create() {
        const hapiServer = await serverFactory.create();
        return new Dsl(new Server(hapiServer));
    }
}
module.exports = Dsl;