import { Migration } from "../migrate.js";

export default new Migration({
	up: function() {
		this.execute(`
		UPDATE transaction t
		  JOIN account a ON t.account_id = a.id 
		   SET t.earmark = account_id, 
		       t.account_id = NULL 
		 WHERE a.type = 'earmark';
		 
		 DELETE FROM transaction WHERE type = 'openingBalance' AND account_id IS NULL;
		 
		 DELETE FROM account WHERE type = 'earmark'`);
	},
	down: function() {
	}
});