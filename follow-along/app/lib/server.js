/**
 * Server-related tasks
 */

// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

// Instantiate the server module object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res) {
	server.unifiedServer(req, res);
});

// Instantiate the HTTPS server
server.httpsServerOptions = {
	key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
	server.unifiedServer(req, res);
});

// All the server logic for both http and https server
server.unifiedServer = function(req, res) {
	// Get the URL and parse it
	const parsedUrl = url.parse(req.url, true);

	// Get the path
	const path = parsedUrl.pathname;
	const trimmedPath = path.replace(/^\/+|\/+$/g, '');

	// Get the query string as an object
	const queryStringObject = parsedUrl.query; // query is an object since we passed true to url.parse()

	// Get the HTTP method
	const method = req.method.toLowerCase();

	// Get the headers as an object
	const headers = req.headers;

	// Get the payload, if any
	const decoder = new StringDecoder('utf8');
	let buffer = '';
	req.on('data', function(data) {
		console.log('data', data);
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		// Choose the handler this request should go to.
		// If one is not found, use the notFound handler
		const chosenHandler = typeof server.router[trimmedPath] !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		const data = {
			trimmedPath,
			queryStringObject,
			method,
			headers,
			payload: helpers.parseJsonToObject(buffer)
		};
		// console.log('data', data);
		// Route the request to the handler specified in the server.router
		chosenHandler(data, function(statusCode, payload) {
			// Use the status code called back by the handler, or default to 200
			statusCode = typeof statusCode === 'number' ? statusCode : 200;

			// Use the payload called called back by the handler, or default to an empty object
			payload = typeof payload === 'object' ? payload : {};

			// Convert the payload to a string
			const payloadString = JSON.stringify(payload);

			// Return the response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			console.log('Returning this response: ', statusCode, payload);
		});

		// Log the request path

		// console.log('URL: ' + req.url)
		// console.log('Request received on path: '
		//   + trimmedPath + ' with method: '
		//   + method + ' and with these query string parameters', queryStringObject);
		// console.log('Headers', headers);
		// console.log('Payload', buffer);
	});
};

// Define a request server.router
server.router = {
	ping: handlers.ping,
	users: handlers.users,
	tokens: handlers.tokens,
	checks: handlers.checks
};

// Init script
server.init = function() {
	// Start the HTTP server
	server.httpServer.listen(config.httpPort, function() {
		console.log('The server is listening on port ', config.httpPort);
	});

	// Start the HTTPS server
	server.httpsServer.listen(config.httpsPort, function() {
		console.log('The server is listening on port ', config.httpsPort);
	});
};

// Export the module
module.exports = server;
