module.exports = class AccountsDao {
    constructor(query) {
        this.query = query;
    }

    create(userId, category) {
        return this.query('INSERT INTO category (user_id, id, name, parent_id) VALUES (?, ?, ?, ?)', userId, category.id, category.name, category.parentId);
    }

    async category(userId, id) {
        const results = await this.query('SELECT id, name, parent_id as parentId FROM category WHERE user_id = ? AND id = ?', userId, id);
        return results[0];
    }

    categories(userId, id) {
        return this.query('SELECT id, name, parent_id as parentId FROM category WHERE user_id = ? ORDER BY name, id', userId);
    }
};