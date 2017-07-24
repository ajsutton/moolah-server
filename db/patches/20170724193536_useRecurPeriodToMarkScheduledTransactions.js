var useRecurPeriodToMarkScheduledTransactions = new Migration({
	up: function() {
		this.execute('ALTER TABLE transaction DROP KEY idx_scheduled, ADD KEY idx_scheduled (user_id, recur_period)');
	},
	down: function() {
        this.execute('ALTER TABLE transaction DROP KEY idx_scheduled, ADD KEY idx_scheduled (user_id, recur_every)');
	}
});