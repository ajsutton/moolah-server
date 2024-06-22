import { Migration } from "../migrate.js";

export default new Migration({
	up: function() {
		this.execute(`
ALTER TABLE transaction
  ADD COLUMN recur_period VARCHAR(10),
  ADD COLUMN recur_every INT(16),
  ADD KEY idx_scheduled (user_id, recur_every)`);
	},
	down: function() {
		this.execute(`
ALTER TABLE transaction 
  DROP COLUMN recur_period,
  DROP COLUMN recur_every,
  DROP KEY idx_scheduled`);
	}
});