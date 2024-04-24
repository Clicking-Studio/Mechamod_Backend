// // Import necessary module for environment variable configuration
const dotenv = require("dotenv");

// // Load environment variables from .env file
dotenv.config();

// Configuration object with AWS and S3-related settings
const config = {
  region: process.env.REGION || "", // AWS region
  accessKeyId: process.env.ACCESS_KEY_ID || "", // AWS access key ID
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "", // AWS secret access key
  s3BucketName: process.env.S3_BUCKET_NAME || "", // S3 bucket name
  s3BucketFolderName: process.env.S3_BUCKET_FOLDER_NAME || "", // S3 bucket folder name
  imageURL: process.env.IMAGE_URL || "", // Base URL for image files
  stlURL: process.env.STL_URL || "", // Base URL for STL files
  backgroundURL: process.env.BACKGROUND_URL || "", // Base URL for background files
};

// Export the configuration object for use in other parts of the application
module.exports = config;
