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
	hashingSecret: 'staging_secret'
};

// Production environment
environments.production = {
	httpPort: 5000,
	httpsPort: 5001,
	envName: 'production',
	hashingSecret: 'production_secret'
};

// Determine which environments was passed as a command-line arg
const currentEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the envs above, if not, default to staging
const environmentToExport =
	typeof environments[currentEnv] === 'object' ? environments[currentEnv] : environments.staging;

module.exports = environmentToExport;
