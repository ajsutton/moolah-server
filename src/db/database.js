const mysql = require('mysql');
const config = require('../../db/config').mysql;

const pool = mysql.createPool(Object.assign({
    connectionLimit: 50,
}, config));

module.exports = {
    query(sql, ...args) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                } else {
                    connection.query(sql, args, (error, results) => {
                        connection.release();
                        if (error) {
                            reject(error);
                        } else {
                            resolve(results);
                        }
                    });
                }
            });
        });
    },
};