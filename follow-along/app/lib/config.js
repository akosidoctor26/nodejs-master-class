/**
 * Create and export configuration variables
 * 
 */

// Container for all the environments
const environments = {};

// Staging (default) environment
environments.staging = {
	httpPort: 3000,
	httpsPort: 3001,
	envName: 'staging',
	hashingSecret: 'staging_secret',
	maxChecks: 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
};

// Production environment
environments.production = {
	httpPort: 5000,
	httpsPort: 5001,
	envName: 'production',
	hashingSecret: 'production_secret',
	maxChecks: 5,
	twilio: {
		accountSid: 'AC651cd52249d9d391755cae345ba83a20',
		authToken: '262d45371223b3926e26420686401f92',
		fromPhone: '+14133728224'
	}
};

// Determine which environments was passed as a command-line arg
const currentEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the envs above, if not, default to staging
const environmentToExport =
	typeof environments[currentEnv] === 'object' ? environments[currentEnv] : environments.staging;

module.exports = environmentToExport;
