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
export default class CategoryDao {
  constructor(query) {
    this.query = query;
  }

  create(userId, category) {
    return this.query(
      'INSERT INTO category (user_id, id, name, parent_id) VALUES (?, ?, ?, ?)',
      userId,
      category.id,
      category.name,
      category.parentId
    );
  }

  async category(userId, id) {
    const results = await this.query(
      'SELECT id, name, parent_id as parentId FROM category WHERE user_id = ? AND id = ?',
      userId,
      id
    );
    return asCategory(results[0]);
  }

  async categories(userId) {
    const results = await this.query(
      'SELECT id, name, parent_id as parentId FROM category WHERE user_id = ? ORDER BY name, id',
      userId
    );
    return results.map(asCategory);
  }

  store(userId, category) {
    return this.query(
      'UPDATE category SET name = ?, parent_id = ? WHERE user_id = ? AND id = ?',
      category.name,
      category.parentId,
      userId,
      category.id
    );
  }

  async remove(userId, id) {
    await this.query(
      'UPDATE category SET parent_id = NULL WHERE user_id = ? AND parent_id = ?',
      userId,
      id
    );
    await this.query(
      'DELETE FROM category WHERE user_id = ? AND id = ?',
      userId,
      id
    );
  }
}
