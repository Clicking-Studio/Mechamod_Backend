// Import necessary modules
const { S3Client } = require("@aws-sdk/client-s3");
const config = require("../config/config");

// Create an instance of the S3Client with provided configuration
const s3Client = new S3Client({
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});

// Export the configured S3Client for use in other parts of the application
module.exports = s3Client;
