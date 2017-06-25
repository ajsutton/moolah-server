var make_id_a_string = new Migration({
    up: function() {
		this.execute('ALTER TABLE account MODIFY COLUMN id varchar(100) NOT NULL');
    },
    down: function() {
        this.execute('ALTER TABLE account MODIFY COLUMN id int(11) NOT NULL');
    },
});