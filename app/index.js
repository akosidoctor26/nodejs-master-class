/**
 * Primary file for the API
 */


// Dependencies
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// The server should respond to all requests with a string
const server = http.createServer(function (req, res) {

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
  req.on('data', function (data) {
    console.log('data', data)
    buffer += decoder.write(data);
  });

  req.on('end', function () {
    buffer += decoder.end();



    // Send the response
    res.end('Hello World\n');

    // Log the request path

    // console.log('URL: ' + req.url)
    // console.log('Request received on path: '
    //   + trimmedPath + ' with method: '
    //   + method + ' and with these query string parameters', queryStringObject);
    // console.log('Headers', headers);
    console.log('Payload', buffer);
  });

})

// Start the server, and have it listen on port 3000
server.listen(3000, function () {
  console.log('The server is listening on port 3000 now');
});
