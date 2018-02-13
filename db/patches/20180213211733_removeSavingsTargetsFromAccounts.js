var removeSavingsTargetsFromAccounts = new Migration({
    up: function() {
        this.execute(`
		ALTER TABLE account 
		  DROP COLUMN saving_target,
		  DROP COLUMN saving_start_date,
		  DROP COLUMN saving_end_date`);
    },
    down: function() {
        throw 'The data is gone. What do you expect me to do?';
    },
});