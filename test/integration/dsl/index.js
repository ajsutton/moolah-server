const serverFactory = require('../../../src/server');
const AccountsDsl = require('./accountDsl');
const TransactionsDsl = require('./transactionDsl');
const idGenerator = require('../../../src/utils/idGenerator');
const dbTestUtils = require('../../utils/dbTestUtils');

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
        const accountsByAlias = new Map();
        const transactionsByAlias = new Map();
        this.accounts = new AccountsDsl(server, accountsByAlias, transactionsByAlias);
        this.transactions = new TransactionsDsl(server, accountsByAlias, transactionsByAlias);
        this.userIds = [];
    }

    login(args = {}) {
        const userId = idGenerator();
        this.userIds.push(userId);
        this.server.profile = Object.assign({
            userId: userId,
            givenName: 'Jane',
            familyName: 'Doe',
        }, args);
    }

    logout() {
        this.server.profile = undefined;
    }

    async tearDown() {
        this.server.stop();
        await Promise.all(this.userIds.map(userId => dbTestUtils.deleteData(userId)));
    }

    static async create() {
        const hapiServer = await serverFactory.create();
        return new Dsl(new Server(hapiServer));
    }
}
module.exports = Dsl;