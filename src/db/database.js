const AccountDao = require('./accountDao');
const TransactionDao = require('./transactionDao');

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

function beginTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(resolveOrReject(resolve, reject));
    });
}

function commit(connection) {
    return new Promise((resolve, reject) => {
        connection.commit(resolveOrReject(resolve, reject));
    });
}

function rollback(connection) {
    return new Promise((resolve, reject) => {
        connection.rollback(resolveOrReject(resolve, reject));
    });
}

module.exports = {
    daos(request) {
        const connection = request.app.db;
        const query = doQuery.bind(undefined, connection);
        return {
            accounts: new AccountDao(query),
            transactions: new TransactionDao(query)
        }
    },

    async withTransaction(request, action) {
        const daos = this.daos(request);
        try {
            await beginTransaction(request.app.db);
            await action(daos);
            await commit(request.app.db);
        } catch (err) {
            rollback(request.app.db);
            throw err;
        }
    },
};