import dbTestUtils from '../utils/dbTestUtils.js';
import RatesDao from '../../src/db/ratesDao.js';
import { assert } from 'chai';
import idGenerator from '../../src/utils/idGenerator.js';

describe('Rates DAO', function () {
  let connection;
  let userId;
  let ratesDao;

  beforeEach(async function () {
    userId = idGenerator();
    connection = await dbTestUtils.createConnection();
    ratesDao = new RatesDao(dbTestUtils.queryFunction(connection));
  });

  afterEach(async function () {
    await dbTestUtils.deleteData(userId, connection);
    connection.destroy();
  });

  it('should apply current rate', async function () {
    const date = '2025-07-07';
    await ratesDao.setRate(userId, date, 'AUD', 'USD', 500000);

    let result = await ratesDao.convert(userId, 10000, 'AUD', 'USD', date);
    assert.equal(result, 5000);

    result = await ratesDao.convert(userId, 10000, 'USD', 'AUD', date);
    assert.equal(result, 20000);
  });

  it('should apply closest historic rate', async function () {
    const date1 = '2025-07-01';
    const date2 = '2025-07-02';
    const date3 = '2025-07-08';
    await ratesDao.setRate(userId, date1, 'AUD', 'USD', 200000);
    await ratesDao.setRate(userId, date2, 'AUD', 'USD', 500000);
    await ratesDao.setRate(userId, date3, 'AUD', 'USD', 700000);

    let result = await ratesDao.convert(userId, 10000, 'AUD', 'USD', date2);
    assert.equal(result, 5000);

    result = await ratesDao.convert(userId, 10000, 'USD', 'AUD', date2);
    assert.equal(result, 20000);
  });
});
