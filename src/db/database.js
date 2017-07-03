const mysql = require('mysql');
const config = require('../../db/config').mysql;

const pool = mysql.createPool(Object.assign({
    connectionLimit: 50,
    dateStrings: true,
}, config));

const resolveOrReject = (resolve, reject) => (err, value) => {
    if (err) {
        reject(err);
    } else {
        resolve(value);
    }
};

function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection(resolveOrReject(resolve, reject));
    });
}

function doQuery(connection, sql, args) {
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
    async query(sql, ...args) {
        const connection = await getConnection();
        try {
            await doQuery(connection, 'SET sql_mode = "STRICT_ALL_TABLES";', []);
            return await doQuery(connection, sql, args);
        } finally {
            connection.release();
        }
    },

    async withTransaction(action) {
        const connection = await getConnection();
        try {
            await beginTransaction(connection);
            await action({
                async query(sql, ...args) {
                    return doQuery(connection, sql, args);
                },
            });
            await commit(connection);
        } catch (err) {
            rollback(connection);
            throw err;
        }
        finally {
            connection.release();
        }
    },
};