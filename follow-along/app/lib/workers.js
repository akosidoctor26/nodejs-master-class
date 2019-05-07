/**
 * Worker-related tasks
 * 
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');

// Instantiate the worker object
const workers = {};

// Lookup all the checks, get their data, send to a validator
workers.gatherAllChecks = function() {
	// Get all the checks
	_data.list('checks', function(err, checks) {
		if (!err && checks && checks.length > 0) {
			checks.forEach(function(check) {
				// Read in the check data
				_data.read('checks', check, function(err, originalCheckData) {
					if (!err && originalCheckData) {
						// Pass it to the check validator, and let that function continue or log errors as needed
						workers.validateCheckData(originalCheckData);
					} else {
						console.log("Error reading one of the check's data");
					}
				});
			});
		} else {
			console.log('Error: Could not find any checks to process');
		}
	});
};

// Sanity-check the check-data,
workers.validateCheckData = function(originalCheckData) {
	originalCheckData = typeof originalCheckData == 'object' && originalCheckData !== null ? originalCheckData : {};
	originalCheckData.id =
		typeof originalCheckData.id == 'string' && originalCheckData.id.trim().length == 20
			? originalCheckData.id.trim()
			: false;
	originalCheckData.userPhone =
		typeof originalCheckData.userPhone == 'string' && originalCheckData.userPhone.trim().length == 10
			? originalCheckData.userPhone.trim()
			: false;
	originalCheckData.protocol =
		typeof originalCheckData.protocol == 'string' && [ 'http', 'https' ].indexOf(originalCheckData.protocol) > -1
			? originalCheckData.protocol
			: false;
	originalCheckData.url =
		typeof originalCheckData.url == 'string' && originalCheckData.url.trim().length > 0
			? originalCheckData.url.trim()
			: false;
	originalCheckData.method =
		typeof originalCheckData.method == 'string' &&
		[ 'post', 'get', 'put', 'delete' ].indexOf(originalCheckData.method) > -1
			? originalCheckData.method
			: false;
	originalCheckData.successCodes =
		typeof originalCheckData.successCodes == 'object' &&
		originalCheckData.successCodes instanceof Array &&
		originalCheckData.successCodes.length > 0
			? originalCheckData.successCodes
			: false;
	originalCheckData.timeoutSeconds =
		typeof originalCheckData.timeoutSeconds == 'number' &&
		originalCheckData.timeoutSeconds % 1 === 0 &&
		originalCheckData.timeoutSeconds >= 1 &&
		originalCheckData.timeoutSeconds <= 5
			? originalCheckData.timeoutSeconds
			: false;
	// Set the keys that may not be set (if the workers have never seen this check before)
	originalCheckData.state =
		typeof originalCheckData.state == 'string' && [ 'up', 'down' ].indexOf(originalCheckData.state) > -1
			? originalCheckData.state
			: 'down';
	originalCheckData.lastChecked =
		typeof originalCheckData.lastChecked == 'number' && originalCheckData.lastChecked > 0
			? originalCheckData.lastChecked
			: false;

	// If all checks pass, pass the data along to the next step in the process
	if (
		originalCheckData.id &&
		originalCheckData.userPhone &&
		originalCheckData.protocol &&
		originalCheckData.url &&
		originalCheckData.method &&
		originalCheckData.successCodes &&
		originalCheckData.timeoutSeconds
	) {
		workers.performCheck(originalCheckData);
	} else {
		// If checks fail, log the error and fail silently
		console.log('Error: one of the checks is not properly formatted. Skipping.');
	}
};
// Perform the check, send the originalCheck data and the outcome of the check process to the next step in the process
workers.performCheck = function(originalCheckData) {
	// Prepare the initial check outcome
	const checkeOutcome = {
		error: false,
		responseCode: false
	};

	// Mark that the outcome has not been sent yet
	let outcomeSent = false;

	// Parse the hostname and the path out of the original check data
	const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
	const hostName = parsedUrl.hostname;
	const path = parsedUrl.path; // using path and not pathname because we want querystring

	// COnstruct the request
	const requestDetails = {
		protocol: originalCheckData.protocol + ':',
		hostname: hostName,
		method: originalCheckData.method.toUpperCase(),
		path: path,
		timeout: originalCheckData.timeoutSeconds * 1000
	};

	// Instantiate the requst object (either http or https)
	const _moduleToUse = originalCheckData.protocol === 'http' ? http : https;
	const req = _moduleToUse.request(requestDetails, function(res) {
		// Grab the status of the sentr requets
		const status = res.statusCode;

		// Update the checkeOutcome and pass the data along
		checkeOutcome.responseCode = status;

		if (!outcomeSent) {
			workers.processCheckOutcome(originalCheckData, checkeOutcome);
			outcomeSent = true;
		}
	});

	//  Bind to the error event so it doesn't get thrown
	req.on('error', function(err) {
		// Update the checkoutcome and pass the data along
		checkeOutcome.error = { error: true, value: e };

		if (!outcomeSent) {
			workers.processCheckOutcome(originalCheckData, checkeOutcome);
			outcomeSent = true;
		}
	});

	// Bind to the timeout event
	req.on('timeout', function(err) {
		// Update the checkoutcome and pass the data along
		checkeOutcome.error = { error: true, value: 'timeout' };

		if (!outcomeSent) {
			workers.processCheckOutcome(originalCheckData, checkeOutcome);
			outcomeSent = true;
		}
	});

	// End the request
	req.end();
};

// Process the check outcome, update the check data as needed, trigger an alert if needed
// Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
	// Decide if the check is considered up or down
	var state =
		!checkOutcome.error &&
		checkOutcome.responseCode &&
		originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
			? 'up'
			: 'down';

	// Decide if an alert is warranted
	var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

	// Update the check data
	var newCheckData = originalCheckData;
	newCheckData.state = state;
	newCheckData.lastChecked = Date.now();

	// Save the updates
	_data.update('checks', newCheckData.id, newCheckData, function(err) {
		if (!err) {
			// Send the new check data to the next phase in the process if needed
			if (alertWarranted) {
				workers.alertUserToStatusChange(newCheckData);
			} else {
				console.log('Check outcome has not changed, no alert needed');
			}
		} else {
			console.log('Error trying to save updates to one of the checks');
		}
	});
};
// Alert the user as to a change in their check status
workers.alertUserToStatusChange = function(newCheckData) {
	const msg =
		'Alert: Your check for ' +
		newCheckData.method.toUpperCase() +
		' ' +
		newCheckData.protocol +
		'://' +
		newCheckData.url +
		' is currently ' +
		newCheckData.state;

	helpers.sendTwilioSms(newCheckData.userPhone, msg, function(err) {
		if (!err) {
			console.log('Success: User was alerted to a status change in their check, via sms: ' + msg);
		} else {
			console.log('Could not send sms alert to user who had a state change to their check');
		}
	});
};

// Timer to execute the worker-process once per minute
workers.loop = function() {
	setInterval(function() {
		workers.gatherAllChecks();
	}, 1000 * 60);
};

// Init script
workers.init = function() {
	// Execute all the checks immediately
	workers.gatherAllChecks();

	// Call the loop so the checks will execute later on
	workers.loop();
};

// Export the module
module.exports = workers;
