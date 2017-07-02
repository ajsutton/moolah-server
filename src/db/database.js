const mysql = require('mysql');
const config = require('../../db/config').mysql;

const pool = mysql.createPool(Object.assign({
    connectionLimit: 50,
    dateStrings: true,
}, config));



module.exports = {
    query(sql, ...args) {
        return new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                } else {
                    const query = (sql, args, nextAction) => connection.query(sql, args, (error, results) => {
                        if (error) {
                            connection.release();
                            reject(error);
                        } else {
                            nextAction(results);
                        }
                    });

                    query('SET sql_mode = "STRICT_ALL_TABLES";', [], () => {
                        query(sql, args, (results) => {
                            connection.release();
                            resolve(results);
                        });
                    });
                }
            });
        });
    },
};