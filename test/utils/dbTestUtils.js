const MySQL = require('mysql');
const sinon = require('sinon');
const db = require('../../src/db/database');
const mysqlConfig = require('../../db/config').mysql;

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

module.exports = {
    async deleteData(userId, conn) {
        const connection = conn === undefined ? this.createConnection() : conn;
        await doQuery(connection, 'DELETE FROM account WHERE user_id = ?', userId);
        await doQuery(connection, 'DELETE FROM transaction WHERE user_id = ?', userId);
        connection.destroy();
    },

    createConnection() {
        return MySQL.createConnection(mysqlConfig);
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
            transaction: sinon.stub(),
            store: sinon.stub(),
        };
        const daos = {
            accounts: accountDao,
            transactions: transactionDao,
        };
        sinon.stub(db, 'daos');
        sinon.stub(db, 'withTransaction');
        db.daos.returns(daos);
        db.withTransaction.callsFake((request, action) => action(daos));
        return daos;
    },

    restoreDaos() {
        db.daos.restore();
        db.withTransaction.restore();
    },
};