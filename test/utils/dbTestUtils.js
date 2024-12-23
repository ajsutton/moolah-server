import MySQL from 'mysql2';
import sinon from 'sinon';
import db from '../../src/db/database.js';
import configue from '../../src/config.js';

const resolveOrReject = (resolve, reject) => (err, value) => {
  if (err) {
    reject(err);
  } else {
    resolve(value);
  }
};

function doQuery(connection, sql, ...args) {
  return new Promise((resolve, reject) => {
    connection.query(sql, args, resolveOrReject(resolve, reject));
  });
}

export default {
  async deleteData(userId, conn) {
    const connection =
      conn === undefined ? await this.createConnection() : conn;
    await doQuery(connection, 'DELETE FROM account WHERE user_id = ?', userId);
    await doQuery(connection, 'DELETE FROM earmark WHERE user_id = ?', userId);
    await doQuery(connection, 'DELETE FROM category WHERE user_id = ?', userId);
    await doQuery(
      connection,
      'DELETE FROM transaction WHERE user_id = ?',
      userId
    );
    connection.destroy();
  },

  async createConnection() {
    await configue.resolve();
    return MySQL.createConnection(configue.get('database'));
  },

  queryFunction(connection) {
    return doQuery.bind(undefined, connection);
  },

  stubDaos() {
    const accountDao = {
      create: sinon.stub(),
      accounts: sinon.stub(),
      account: sinon.stub(),
      store: sinon.stub(),
    };
    const transactionDao = {
      create: sinon.stub(),
      balance: sinon.stub(),
      transactionCount: sinon.stub(),
      transaction: sinon.stub(),
      transactions: sinon.stub(),
      store: sinon.stub(),
    };
    const investmentValueDao = {
      getLatestValue: sinon.stub(),
    };
    const daos = {
      accounts: accountDao,
      transactions: transactionDao,
      investmentValue: investmentValueDao,
    };
    sinon.stub(db, 'withTransaction');
    db.withTransaction.callsFake((request, action) => action(daos));
    return daos;
  },

  restoreDaos() {
    db.withTransaction.restore();
  },
};
