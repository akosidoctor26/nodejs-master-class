/**
 * Primary file for the API
 */

// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all requests with a string
const server = http.createServer(function(req, res) {
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
});

// Start the server, and have it listen on port 3000
server.listen(3000, function() {
	console.log('The server is listening on port 3000 now');
});

// Define the handlers
const handlers = {};

// Sample handler
handlers.sample = function(data, callback) {
	// Callback a http status code, and a payload object
	callback(406, { name: 'sample handler' });
};

// Not Found handler
handlers.notFound = function(data, callback) {
	callback(404);
};

// Define a request router
const router = {
	sample: handlers.sample
};
