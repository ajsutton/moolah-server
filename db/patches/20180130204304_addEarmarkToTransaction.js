var addEarmarkToTransaction = new Migration({
    up: function() {
        this.execute('ALTER TABLE transaction ADD COLUMN earmark VARCHAR(255) DEFAULT NULL');
    },
    down: function() {
        this.execute('ALTER TABLE transaction DROP COLUMN earmark');
    }
});