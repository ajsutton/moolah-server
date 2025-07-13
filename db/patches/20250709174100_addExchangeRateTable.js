import { Migration } from '../migrate.js';

export default new Migration({
  up: function () {
    this.execute(`
      CREATE TABLE exchange_rate (
        user_id    VARCHAR(255) NOT NULL,
        date       DATE         NOT NULL,
        base       VARCHAR(10)  NOT NULL,
        quote      VARCHAR(10)  NOT NULL,
        rate       INT(20)      NOT NULL,
        PRIMARY KEY (user_id, base, quote, date)
      )
      ENGINE = InnoDB
      DEFAULT CHARSET = utf8;`);
  },
  down: function () {
    this.execute('DROP TABLE exchange_rate');
  },
});
