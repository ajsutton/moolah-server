import { Migration } from "../migrate.js";

export default new Migration({
	up: function() {
		this.execute('CREATE TABLE investment_value (' +
			'user_id VARCHAR(255) NOT NULL,' +
			'account_id VARCHAR(255) NOT NULL,' +
			'date DATE NOT NULL,' +
			'value INT(16) NOT NULL,' +
			'PRIMARY KEY (user_id, account_id, date)' +
		') DEFAULT CHARSET=utf8 ENGINE=InnoDB');
	},
	down: function() {
		this.execute('DROP TABLE investment_value');
	}
});