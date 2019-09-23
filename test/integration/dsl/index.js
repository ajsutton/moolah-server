const serverFactory = require('../../../src/server');
const AccountsDsl = require('./accountDsl');
const EarmarksDsl = require('./earmarkDsl');
const BudgetsDsl = require('./budgetsDsl');
const TransactionsDsl = require('./transactionDsl');
const AnalysisDsl = require('./analysisDsl');
const CategoriesDsl = require('./categoryDsl');
const idGenerator = require('../../../src/utils/idGenerator');
const dbTestUtils = require('../../utils/dbTestUtils');

class Server {
    constructor(hapiServer) {
        this.hapiServer = hapiServer;
        this.profile = null;
    }

    async request(options, expectedStatusCode) {
        const stack = new Error();
        const response = await this.hapiServer.inject(options);
        if (response.statusCode !== expectedStatusCode) {
            stack.message = `Incorrect status code. Expected ${expectedStatusCode} but got ${response.statusCode}. Payload: ${response.payload}`;
            throw stack;
        } else {
            return response;
        }
    }

    async post(url, payload, expectedStatusCode) {
        return this.request({
                url: url,
                method: 'POST',
                payload: payload,
                auth: this.profile,
            },
            expectedStatusCode);
    }

    get(url, expectedStatusCode) {
        return this.request({
                url: url,
                method: 'GET',
                auth: this.profile,
            },
            expectedStatusCode);
    }

    put(url, payload, expectedStatusCode) {
        return this.request({
                url,
                method: 'PUT',
                payload,
                auth: this.profile,
            },
            expectedStatusCode);
    }

    delete(url, expectedStatusCode) {
        return this.request({
                url: url,
                method: 'DELETE',
                auth: this.profile,
            },
            expectedStatusCode);
    }

    async stop() {
        await this.hapiServer.stop();
    }
}

class Dsl {
    constructor(server) {
        this.server = server;
        const accountsByAlias = new Map();
        const transactionsByAlias = new Map();
        const categoriesByAlias = new Map();
        this.accounts = new AccountsDsl(server, accountsByAlias, transactionsByAlias);
        this.earmarks = new EarmarksDsl(server, accountsByAlias, transactionsByAlias);
        this.budgets = new BudgetsDsl(server, accountsByAlias, categoriesByAlias);
        this.transactions = new TransactionsDsl(server, accountsByAlias, transactionsByAlias, categoriesByAlias);
        this.analysis = new AnalysisDsl(server, accountsByAlias, categoriesByAlias);
        this.categories = new CategoriesDsl(server, categoriesByAlias);
        this.userIds = [];
    }

    login(args = {}) {
        const userId = idGenerator();
        this.userIds.push(userId);
        this.server.profile = {
            strategy: 'cookie', 
            credentials: Object.assign({
                userId: userId,
                givenName: 'Jane',
                familyName: 'Doe',
            }, args),
        };
    }

    logout() {
        this.server.profile = undefined;
    }

    async tearDown() {
        await this.server.stop();
        await Promise.all(this.userIds.map(userId => dbTestUtils.deleteData(userId)));
    }

    static async create() {
        const hapiServer = await serverFactory.create();
        return new Dsl(new Server(hapiServer));
    }
}

module.exports = Dsl;