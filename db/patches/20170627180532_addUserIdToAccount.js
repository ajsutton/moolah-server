import { Migration } from "../migrate.js";

export default new Migration({
    up: function() {
        this.execute('DROP TABLE IF EXISTS account; ' +
            'CREATE TABLE account (' +
            '    user_id VARCHAR(255) NOT NULL,' +
            '    id VARCHAR(100) NOT NULL,' +
            '    name VARCHAR(255) NOT NULL,' +
            '    type VARCHAR(25) NOT NULL,' +
            '    balance INT NOT NULL,' +
            '    PRIMARY KEY (user_id, id)' +
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8;');
    },
    down: function() {
        this.execute('DROP TABLE account;');
    },
});