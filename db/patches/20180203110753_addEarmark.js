import { Migration } from "../migrate.js";

export default new Migration({
    up: function() {
        this.execute(`
		CREATE TABLE earmark (
		  user_id varchar(255) NOT NULL,
		  id varchar(100) NOT NULL,
		  name varchar(255) NOT NULL,
		  position int(16) NOT NULL DEFAULT '0',
		  saving_target int(16) DEFAULT NULL,
		  saving_start_date date DEFAULT NULL,
		  saving_end_date date DEFAULT NULL,
		  PRIMARY KEY (user_id,id)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8;
		INSERT INTO earmark SELECT user_id, id, name, position, saving_target, saving_start_date, saving_end_date FROM account WHERE type = 'earmark'`);
    },
    down: function() {
        this.execute(`DROP TABLE earmark`);
    },
});