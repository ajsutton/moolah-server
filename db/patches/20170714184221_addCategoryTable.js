var addCategoryTable = new Migration({
    up: function() {
        this.execute(`
CREATE TABLE category (
  user_id    VARCHAR(255) NOT NULL,
  id         VARCHAR(255) NOT NULL,
  name       VARCHAR(255) NOT NULL,
  parent_id  VARCHAR(255),
  PRIMARY KEY (user_id, id),
  KEY (user_id, name)
)
  ENGINE = InnoDB
  DEFAULT CHARSET = utf8;`);
    },
    down: function() {
        this.execute('DROP TABLE category;');
    },
});