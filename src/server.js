import Hapi from '@hapi/hapi';
import configue from './config.js';
import securityHeaders from './plugins/securityHeaders.js';
import database from './plugins/database.js';
import cookie from '@hapi/cookie';
import bell from '@hapi/bell';
import pino from 'hapi-pino';
import joi from 'joi';
import router from './plugins/router.js';

export const create = async function () {
  const server = new Hapi.Server({ port: 3000, host: 'localhost' });
  await server.register(configue.plugin17());
  await securityHeaders(server);

  const authConfig = server.configue('authentication');
  const logConfig = server.configue('logging');
  await server.register([
    database(server),
    cookie,
    bell,
    {
      plugin: pino,
      options: {
        enabled: logConfig.console.enabled && process.env.NODE_ENV !== 'test',
        // Redact Authorization headers, see https://getpino.io/#/docs/redaction
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    },
  ]);
  server.validator(joi);

  // Work around for https://github.com/midnightcodr/hapi-mysql2/pull/1 until it gets merged and a new version published
  server.events.on('stop', () => {
    try {
      server.mysql.pool.end();
    } catch (err) {
      server.log(
        ['moolah', 'error'],
        'Failed to shutdown database connection pool: ' + err.message,
        err
      );
    }
  });

  server.auth.strategy('session', 'cookie', {
    cookie: {
      password: authConfig.secureToken,
      isSecure: server.configue('https'),
    },
  });
  server.auth.strategy('google', 'bell', {
    provider: 'google',
    password: authConfig.secureToken,
    isSecure: server.configue('https'),
    clientId: authConfig.googleClientId,
    clientSecret: authConfig.clientSecret,
    location: authConfig.baseUrl,
    scope: ['profile'],
  });

  await router(server);

  return server;
};
