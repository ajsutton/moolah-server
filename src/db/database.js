const AccountDao = require('./accountDao');
const TransactionDao = require('./transactionDao');
const CategoryDao = require('./categoryDao');
const AnalysisDao = require('./analysisDao');

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

function makeDaos(connection) {
    const query = doQuery.bind(undefined, connection);
    return {
        accounts: new AccountDao(query),
        transactions: new TransactionDao(query),
        categories: new CategoryDao(query),
        analysis: new AnalysisDao(query),
    };
}

function getConnection(pool) {
    return new Promise((resolve, reject) => {
        pool.getConnection(resolveOrReject(resolve, reject));
    });
}

module.exports = {
    daos(request) {
        const connection = request.server.plugins['hapi-mysql2'].pool;
        return makeDaos(connection);
    },

    async withTransaction(request, action) {
        const connection = await getConnection(request.server.plugins['hapi-mysql2'].pool);
        try {
            const daos = makeDaos(connection);
            await beginTransaction(connection);
            await action(daos);
            await commit(connection);
        } catch (err) {
            rollback(connection);
            throw err;
        } finally {
            connection.release();
        }
    },
};