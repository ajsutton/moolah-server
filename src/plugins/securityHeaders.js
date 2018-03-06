module.exports = server => {
    setHeader(server, 'X-Content-Type-Options', 'nosniff');
};

function setHeader(server, key, value) {
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;
        if (request.response.isBoom) {
            response.output.headers[key] = value;
        } else {
            response.header(key, value);
        }
        return h.continue;
    });
}