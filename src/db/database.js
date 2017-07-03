const mysql = require('mysql');
const config = require('../../db/config').mysql;

const pool = mysql.createPool(Object.assign({
    connectionLimit: 50,
    dateStrings: true,
}, config));

function getConnection() {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err);
            } else {
                resolve(connection);
            }
        });
    });
}

function query(connection, sql, args) {
    return new Promise((resolve, reject) => {
        connection.query(sql, args, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = {
    async query(sql, ...args) {
        const connection = await getConnection();
        try {
            await query(connection, 'SET sql_mode = "STRICT_ALL_TABLES";', []);
            return await query(connection, sql, args);
        } finally {
            connection.release();
        }
    },
};