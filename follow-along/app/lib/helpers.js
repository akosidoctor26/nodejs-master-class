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

// Export the module
module.exports = helpers;
