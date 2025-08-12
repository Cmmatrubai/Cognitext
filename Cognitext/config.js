// Configuration for different environments
const config = {
  development: {
    apiBaseUrl: "http://localhost:8080",
  },
  production: {
    apiBaseUrl: "https://cognitext.onrender.com",
  },
};

// Determine environment - you can change this manually or set NODE_ENV
const env = process.env.NODE_ENV || "development";
const currentConfig = config[env];

console.log(`Environment: ${env}`);
console.log(`API Base URL: ${currentConfig.apiBaseUrl}`);

module.exports = currentConfig;
