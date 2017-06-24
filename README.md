# Moolah Server
> Back-end server for Moolah money tracker

## Database Setup
Configure the database by creating a db/config.mine.js file.

``` javascript
module.exports = {
    user: 'root',
    password: '',
    database: 'moolah'
}
```
The database will need to exist, then run <code>npm run migrate-db</code> to install or update the required tables.

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

# continuously run unit tests
npm run test-watch
```