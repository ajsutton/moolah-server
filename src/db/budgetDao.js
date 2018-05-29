

module.exports = class BudgetsDao {
    constructor(query) {
        this.query = query;
    }

    async setBudget(userId, earmarkId, categoryId, amount) {
        return this.query(
            'INSERT INTO budget (user_id, earmark_id, category_id, amount) VALUES (?, ?, ?, ?)',
            userId, earmarkId, categoryId, amount);
    }

    async getBudget(userId, earmarkId, categoryId) {
        const results = await this.query('SELECT IFNULL(amount, 0) as amount FROM budget WHERE user_id = ? AND earmark_id = ? AND category_id = ?',
            userId, earmarkId, categoryId);
        return results.length > 0 ? results[0].amount : 0;
    }

    async removeCategory(userId, categoryId, replacementCategoryId = null) {
        await this.query('UPDATE IGNORE budget SET category_id = ? WHERE user_id = ? AND category_id = ?', replacementCategoryId, userId, categoryId);
        await this.query('DELETE FROM budget WHERE user_id = ? AND category_id = ?', userId, categoryId);
    }
}