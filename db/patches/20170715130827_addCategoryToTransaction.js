import { Migration } from "../migrate.js";

export default new Migration({
    up: function() {
        this.execute(`
ALTER TABLE transaction ADD COLUMN category_id VARCHAR(255), 
ADD KEY category (user_id, category_id, date)
		`);
    },
    down: function() {
        this.execute('ALTER TABLE transaction DROP KEY category, DROP COLUMN category_id')
    },
});