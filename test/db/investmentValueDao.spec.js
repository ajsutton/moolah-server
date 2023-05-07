const dbTestUtils = require('../utils/dbTestUtils');
const ValueDao = require('../../src/db/investmentValueDao');
const assert = require('chai').assert;
const idGenerator = require('../../src/utils/idGenerator');

describe('Investment Value DAO', function() {
    let connection;
    let userId;
    let accountId;
    let valueDao;


    beforeEach(async function() {
        userId = idGenerator();
        accountId = idGenerator();
        connection = await dbTestUtils.createConnection();
        valueDao = new ValueDao(dbTestUtils.queryFunction(connection));
    });

    afterEach(async function() {
        await dbTestUtils.deleteData(userId, connection);
        connection.destroy();
    });

    it('should round trip values', async function() {
        await valueDao.setValue(userId, accountId, '2023-02-21', 15000);
        await valueDao.setValue(userId, accountId, '2023-02-23', 17000);
        await valueDao.setValue(userId, accountId, '2023-02-22', 16000);
        const actual = await valueDao.getLatestValue(userId, accountId);
        assert.equal(actual, 17000);

        const allValues = await valueDao.getValues(userId, {accountId: accountId})
        assert.deepEqual(allValues, [
            {date: '2023-02-23', value: 17000}, 
            {date: '2023-02-22', value: 16000}, 
            {date: '2023-02-21', value: 15000}, 
        ])
    });

    it('should update existing value', async function() {
        await valueDao.setValue(userId, accountId, '2023-02-21', 15000);
        await valueDao.setValue(userId, accountId, '2023-02-21', 17000);
        await valueDao.setValue(userId, accountId, '2023-02-21', 16000);
        const actual = await valueDao.getLatestValue(userId, accountId);
        assert.equal(actual, 16000);

        const allValues = await valueDao.getValues(userId, {accountId: accountId})
        assert.deepEqual(allValues, [
            {date: '2023-02-21', value: 16000}, 
        ])
    })

    it('should remove value', async function() {
        await valueDao.setValue(userId, accountId, '2023-02-21', 15000);
        await valueDao.setValue(userId, accountId, '2023-02-23', 17000);

        await valueDao.removeValue(userId, accountId, '2023-02-23')
        const actual = await valueDao.getLatestValue(userId, accountId);
        assert.equal(actual, 15000);

        const allValues = await valueDao.getValues(userId, {accountId: accountId})
        assert.deepEqual(allValues, [
            {date: '2023-02-21', value: 15000}, 
        ])
    })
});