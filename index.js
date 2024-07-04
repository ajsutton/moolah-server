import { create } from './src/server.js';

create()
  .then(server => {
    server.start(err => {
      if (err) throw err;

      server.log(`Server running at: ${server.info.uri}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server', err);
  });
