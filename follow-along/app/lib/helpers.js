/**
 * Helpers for various tasks
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

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

// Export the module
module.exports = helpers;
