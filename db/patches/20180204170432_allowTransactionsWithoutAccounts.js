var allowTransactionsWithoutAccounts = new Migration({
	up: function() {
		this.execute(`ALTER TABLE transaction MODIFY COLUMN account_id VARCHAR(255)`)
	},
	down: function() {
        this.execute(`ALTER TABLE transaction MODIFY COLUMN account_id VARCHAR(255) NOT NULL`)
	}
});