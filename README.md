# Moolah Server
> Back-end server for Moolah money tracker

This project provides a st of APIs that clients can use. A [web based UI](https://github.com/bretthenderson/moolah) is under development as a separate project.

## Configuration
Moolah requires a MySQL database for storage and a Google OAuth 2.0 client ID for authentication. These are configured in config/config.json  An example config file showing the syntax is provided in config/config.example.json.

The database schema will need to exist, then run <code>npm run migrate-db</code> to install or update the required tables.

See the [Google documentation](https://developers.google.com/identity/protocols/OpenIDConnect) to create an OAuth 2.0 client ID.

## Build Setup

``` bash
# install dependencies
npm install

# Configure/update database
npm run migrate-db

# serve with hot reload at localhost:3000
npm run dev

# serve in production mode
npm start

# run unit tests
npm run test

# continuously run tests
npm run test-watch
```