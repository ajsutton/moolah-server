import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(`
CREATE TABLE transaction (
  user_id    VARCHAR(255) NOT NULL,
  id         VARCHAR(255) NOT NULL,
  type       VARCHAR(20)  NOT NULL,
  date       DATE         NOT NULL,
  account_id VARCHAR(255) NOT NULL,
  payee      VARCHAR(1024),
  amount     INT(16)      NOT NULL,
  notes      TEXT,
  PRIMARY KEY (user_id, id),
  KEY (user_id, date),
  KEY (user_id, account_id, date)
)
  ENGINE = InnoDB
  DEFAULT CHARSET = utf8;`);
  },
  down: function () {
    this.execute('DROP TABLE transaction;');
  },
});
