var addHiddenToAccount = new Migration({
	up: function() {
		this.execute('ALTER TABLE account ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false');
	},
	down: function() {
        this.execute('ALTER TABLE account DROP COLUMN hidden');
	}
});