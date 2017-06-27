const JWT = require('jsonwebtoken');
const config = require('./authConfig');

function profileHandler(request, reply, tokens, profile) {
    if (profile) {
        // extract the relevant data from Profile to store in JWT object
        const session = {
            givenName: profile.name.givenName,
            familyName: profile.name.familyName,
            userId: profile.url,
            exp: Math.floor(new Date().getTime() / 1000) + 7 * 24 * 60 * 60, // Expiry in seconds!
        };

        // create a JWT to set as the cookie:
        const token = JWT.sign(session, config.jwtSecret);
        // store the Profile and Oauth tokens in the Redis DB using G+ id as key
        // Detailed Example...? https://github.com/dwyl/hapi-auth-google/issues/2

        // reply to client with a view
        return reply('Hello ' + profile.name.givenName + ' You Logged in Using Google!')
            .state('token', token, {isSecure: false}); // see: http://hapijs.com/tutorials/cookies
    }
    else {
        return reply('Sorry, something went wrong, please try again.');
    }
}

const options = {
    REDIRECT_URL: '/googleauth',
    handler: profileHandler,
    config: {
        description: 'Google auth callback',
        notes: 'Handled by hapi-auth-google plugin',
        tags: ['api', 'auth', 'plugin'],
    },
    access_type: 'online', // options: offline, online
    approval_prompt: 'auto', // options: always, auto
    scope: 'https://www.googleapis.com/auth/plus.profile.emails.read', // ask for their email address
    // can use process.env or if you prefer, define here in options:
    BASE_URL: config.baseUrl,
    GOOGLE_CLIENT_ID: config.googleClientId,
    GOOGLE_CLIENT_SECRET: config.clientSecret,
};

module.exports = {
    register: require('hapi-auth-google'),
    options
};