const db = require('../../src/db/database');

module.exports = {
    async deleteData(userId) {
        await db.query('DELETE FROM account WHERE user_id = ?', userId);
        await db.query('DELETE FROM transaction WHERE user_id = ?', userId);
    }
};