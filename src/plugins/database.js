import hapiMysql2 from 'hapi-mysql2';

export default server => {
  const config = server.configue('database');
  const options = {
    settings: config,
    decorate: 'mysql',
    decimalNumbers: true,
  };
  return {
    plugin: hapiMysql2,
    options,
  };
};
