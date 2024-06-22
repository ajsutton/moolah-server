import { Migration } from "../migrate.js";

export default new Migration({
	up: function() {
		this.execute('CREATE TABLE budget (' +
			'user_id VARCHAR(255) NOT NULL,' +
			'earmark_id VARCHAR(255) NOT NULL,' +
			'category_id VARCHAR(255) NOT NULL,' +
			'amount INT(16) NOT NULL,' +
			'PRIMARY KEY (user_id, earmark_id, category_id)' +
		') DEFAULT CHARSET=utf8 ENGINE=InnoDB');
	},
	down: function() {
		this.execute('DROP TABLE budget');
	}
});