function asCategory(object) {
    if (object === undefined) {
        return object;
    }
    const category = {};
    Object.entries(object).forEach(([key, value]) => {
        if (value !== null) {
            category[key] = value;
        }
    });
    return category;
}
module.exports = class CategoryDao {
    constructor(query) {
        this.query = query;
    }

    create(userId, category) {
        return this.query('INSERT INTO category (user_id, id, name, parent_id) VALUES (?, ?, ?, ?)', userId, category.id, category.name, category.parentId);
    }

    async category(userId, id) {
        const results = await this.query('SELECT id, name, parent_id as parentId FROM category WHERE user_id = ? AND id = ?', userId, id);
        return asCategory(results[0]);
    }

    async categories(userId, id) {
        const results = await this.query('SELECT id, name, parent_id as parentId FROM category WHERE user_id = ? ORDER BY name, id', userId);
        return results.map(asCategory);
    }
};