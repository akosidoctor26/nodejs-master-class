/**
 * Primary file for the API
 */

// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

// Instantiate the HTTP server
const httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, function() {
	console.log('The server is listening on port ', config.httpPort);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
  unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
	console.log('The server is listening on port ', config.httpsPort);
});

// All the server logic for both http and https server
const unifiedServer = function(req, res) {
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
		const chosenHandler = typeof router[trimmedPath] !== 'undefined' ? router[trimmedPath] : handlers.notFound;

		// Construct the data object to send to the handler
		const data = {
			trimmedPath,
			queryStringObject,
			method,
			headers,
			buffer
		};

		// Route the request to the handler specified in the router
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
		console.log('Payload', buffer);
	});
};

// Define the handlers
const handlers = {};

// Not Found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

handlers.ping = function(data, callback) {
  callback(200);
}

// Define a request router
const router = {
	ping: handlers.ping
};
