const serverFactory = require('../../../src/server');
const AccountsDsl = require('./accountDsl');
const TransactionsDsl = require('./transactionDsl');
const AnalysisDsl = require('./analysisDsl');
const CategoriesDsl = require('./categoryDsl');
const idGenerator = require('../../../src/utils/idGenerator');
const dbTestUtils = require('../../utils/dbTestUtils');

const checkStatusCode = (expectedStatusCode, stack, resolve, reject) => response => {
    if (response.statusCode !== expectedStatusCode) {
        stack.message = `Incorrect status code. Expected ${expectedStatusCode} but got ${response.statusCode}. Payload: ${response.payload}`;
        reject(stack);
    } else {
        resolve(response);
    }
};
class Server {
    constructor(hapiServer) {
        this.hapiServer = hapiServer;
        this.profile = null;
    }

    post(url, payload, expectedStatusCode) {
        const stack = new Error();
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                    url: url,
                    method: 'POST',
                    payload: payload,
                    credentials: this.profile,
                },
                checkStatusCode(expectedStatusCode, stack, resolve, reject));
        });
    }

    get(url, expectedStatusCode) {
        const stack = new Error();
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                    url: url,
                    method: 'GET',
                    credentials: this.profile,
                },
                checkStatusCode(expectedStatusCode, stack, resolve, reject));
        });
    }

    put(url, payload, expectedStatusCode) {
        const stack = new Error();
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                    url,
                    method: 'PUT',
                    payload,
                    credentials: this.profile,
                },
                checkStatusCode(expectedStatusCode, stack, resolve, reject));
        });
    }

    delete(url, expectedStatusCode) {
        const stack = new Error();
        return new Promise((resolve, reject) => {
            this.hapiServer.inject({
                    url: url,
                    method: 'DELETE',
                    credentials: this.profile,
                },
                checkStatusCode(expectedStatusCode, stack, resolve, reject));
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
        const categoriesByAlias = new Map();
        this.accounts = new AccountsDsl(server, accountsByAlias, transactionsByAlias);
        this.transactions = new TransactionsDsl(server, accountsByAlias, transactionsByAlias, categoriesByAlias);
        this.analysis = new AnalysisDsl(server, accountsByAlias, categoriesByAlias);
        this.categories = new CategoriesDsl(server, categoriesByAlias);
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