/**
 * Helpers for various tasks
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const queryString = require('querystring');
const StringDecoder = require('string_decoder').StringDecoder;

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = function(str) {
	if (typeof str === 'string' && str.length > 0) {
		return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
	} else {
		return false;
	}
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
	try {
		const obj = JSON.parse(str);
		return obj;
	} catch (error) {
		return {};
	}
};

// Create a string of random aplhanumeric characters, of a given length
helpers.createRandomString = function(strLength) {
	strLength = typeof strLength === 'number' && strLength > 0 ? strLength : false;
	if (strLength) {
		// Define all the possible chars that could go into a string
		const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		var str = '';
		for (let i = 1; i <= strLength; i++) {
			// Get random char from possible chars
			const randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
			// Append this character to the final string
			str += randomChar;
		}

		// Return the final string
		return str;
	} else {
		return false;
	}
};

// Send an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback) {
	// Validate parameters
	phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false;
	msg = typeof msg === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;
	if (phone && msg) {
		// Configure the request payload
		const payload = {
			From: config.twilio.fromPhone,
			To: '+1' + phone,
			Body: msg
		};

		// Stringify the payload
		const stringPayload = queryString.stringify(payload);

		// Configure the request details
		const requestDetails = {
			protocol: 'https:',
			hostname: 'api.twilio.com',
			method: 'POST',
			path: '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
			auth: config.twilio.accountSid + ':' + config.twilio.authToken,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayload)
			}
		};

		//Instantiate the request object
		const req = https.request(requestDetails, function(res) {
			const status = res.statusCode;
			
			// Callback successfully if the request went through
			if (status === 200 || status === 201) {
				callback(false);
			} else {
				callback('Status code returned was ' + status);
			}
		});

		// Bind to the error event so it doesn't get thrown
		req.on('error', function(e) {
			callback(e);
		});

		let buffer;
		const decoder = new StringDecoder('utf8');
		req.on('data', function(data) {
			buffer += decoder.write(data);
		});

		req.on('end', function(finalData) {
			console.log('finalData', finalData);
		});

		//Add the payload
		req.write(stringPayload);

		// End the request
		req.end();
	} else {
		callback('Given parameters were missing or invalid');
	}
};

// Export the module
module.exports = helpers;
