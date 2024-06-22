import Dsl from './dsl/index.js';

describe('Earmark Management', function() {
    let dsl;

    beforeEach(async function() {
        dsl = await Dsl.create();
        dsl.login();
    });

    afterEach(function() {
        return dsl.tearDown();
    });

    describe('Earmark CRUD', function() {
        it('should list earmarks', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', name: 'Earmark 1', balance: 0});
            await dsl.earmarks.createEarmark({alias: 'earmark2', name: 'Earmark 2', balance: 5000});

            await dsl.earmarks.verifyEarmarks({earmarks: ['earmark1', 'earmark2']});
        });

        it('should modify an earmark', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', name: 'Earmark 1', balance: 0});
            await dsl.earmarks.modifyEarmark({alias: 'earmark1', name: 'Modified Earmark'});
            await dsl.earmarks.verifyEarmarks({earmarks: ['earmark1']});
        });

        it('should get a specific earmark', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', name: 'Earmark 1', balance: 0});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1'});
        });

        it('should require a login to get an earmark', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', name: 'Earmark 1', balance: 0});
            dsl.logout();
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', statusCode: 401});
        });

        it('should require login to list earmarks', async function() {
            dsl.logout();
            await dsl.earmarks.verifyEarmarks({statusCode: 401});
        });

        it('should require login to create earmarks', async function() {
            dsl.logout();
            await dsl.earmarks.createEarmark({statusCode: 401});
        });

        it('should require login to modify earmarks', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', name: 'Earmark 1', balance: 0});
            dsl.logout();
            await dsl.earmarks.modifyEarmark({alias: 'earmark1', statusCode: 401});
        });

        it('should default position to 0', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', position: undefined});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', position: 0});
        });
    });

    describe('Savings Goals', function() {
        it('should create earmark with savings goal', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
        });

        it('should modify earmark to add savings goal', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1'});
            await dsl.earmarks.modifyEarmark({alias: 'earmark1', name: 'Foo', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
        });

        it('should modify earmark to remove savings goal', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.earmarks.modifyEarmark({alias: 'earmark1', name: 'Foo'});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1'});
        });

        it('should modify earmark to change savings goal', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.earmarks.modifyEarmark({alias: 'earmark1', name: 'Foo', savingsTarget: 25000, savingsStartDate: '2018-06-01', savingsEndDate: '2018-02-01'});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', name: 'Foo', savingsTarget: 25000, savingsStartDate: '2018-06-01', savingsEndDate: '2018-02-01'});
        });

        it('should include savings goal in full earmarks list', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1', savingsTarget: 500000, savingsStartDate: '2017-06-01', savingsEndDate: '2018-01-01'});
            await dsl.earmarks.verifyEarmarks({earmarks: ['earmark1']});
        });
    });

    describe('Scheduled Earmark Transactions', function() {
        it('should allow scheduled transaction with earmark but no account', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1'});
            await dsl.transactions.createTransaction({alias: 'scheduled', earmark: 'earmark1', type: 'income', amount: 500, recurPeriod: 'WEEK', recurEvery: 2});
        });
    });

    describe('Hidden Earmarks', function() {
        it('should mark earmark as hidden', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1'});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', hidden: false});

            await dsl.earmarks.modifyEarmark({alias: 'earmark1', hidden: true});
            await dsl.earmarks.verifyEarmark({alias: 'earmark1', hidden: true});
        });

        it('should still include hidden earmarks in earmarks list', async function() {
            await dsl.earmarks.createEarmark({alias: 'earmark1'});

            await dsl.earmarks.modifyEarmark({alias: 'earmark1', hidden: true});
            await dsl.earmarks.verifyEarmarks({accounts: ['earmark1']});
        });
    });
});