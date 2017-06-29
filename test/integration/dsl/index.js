const serverFactory = require('../../../src/server');
const AccountsDsl = require('./accountDsl');
const idGenerator = require('../../../src/utils/idGenerator');

class Server {
    constructor(hapiServer) {
        this.hapiServer = hapiServer;
        this.profile = null;
    }

    post(url, payload) {
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                    url: url,
                    method: 'POST',
                    payload: payload,
                    credentials: this.profile,
                },
                function(response) {
                    resolve(response);
                });
        });
    }

    get(url) {
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                url: url,
                method: 'GET',
                credentials: this.profile,
            }, function(response) {
                resolve(response);
            });
        });
    }

    put(url, payload) {
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                url,
                method: 'PUT',
                payload,
                credentials: this.profile,
            }, function(response) {
                resolve(response);
            })
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

    login(args = {}) {
        this.server.profile = Object.assign({
            userId: idGenerator(),
            givenName: 'Jane',
            familyName: 'Doe',
        }, args);
    }

    logout() {
        this.server.profile = undefined;
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