var addToAccountToTransaction = new Migration({
    up: function() {
        this.execute(`ALTER TABLE transaction ADD COLUMN to_account_id VARCHAR(255), ADD KEY idx_to_account_id (user_id, to_account_id, date)`);
    },
    down: function() {
        this.execute(`ALTER TABLE transaction DROP KEY idx_to_account_id, DROP COLUMN to_account_id`);
    },
});