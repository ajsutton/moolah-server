export default {
  auth: {
    strategy: 'session',
    mode: 'try',
  },
  handler: function (request) {
    request.cookieAuth.clear();
    return { loggedIn: false };
  },
};
