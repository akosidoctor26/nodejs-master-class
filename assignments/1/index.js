const http = require('http');
const url = require('url');

const httpServer = http.createServer(function(req, res) {
	const parsedUrl = url.parse(req.url, true);
	const trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');
	console.log(trimmedPath);
	// Event where there  is no more data in the IncomingMessage stream

	req.on('data', function(data) {});

  // To invoke end event we need to attach a callback to data event
	req.on('end', function() {
		const chosenHandler = typeof router[trimmedPath] !== 'undefined' ? router[trimmedPath] : routeHandlers.notFound;

		chosenHandler({}, function(statusCode, payload) {
			console.log(payload);
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(JSON.stringify(payload));

			console.log('Returning response');
		});
	});
});

httpServer.listen(3000, function() {
	console.log('Listening on Port 3000');
});

const routeHandlers = {};
// Not Found handler
routeHandlers.notFound = function(data, callback) {
	callback(404);
};
routeHandlers.hello = function(data, callback) {
	callback(200, 'Welcome to NodeJS Master Class First Assignment');
};
const router = {
	hello: routeHandlers.hello
};
