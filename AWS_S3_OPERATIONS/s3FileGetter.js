// Import necessary modules
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require("../config/config");

// Import the configured S3Client
const s3Client = require("./configureClient");

// Function to get a signed URL for a file in the S3 bucket
const getFileUrlFromS3 = async (key) => {
  // Create a GetObjectCommand with the specified bucket and key
  const getCommand = new GetObjectCommand({
    Bucket: config.s3BucketName, //mechamod
    Key: key, // assets/images/imageName
  });

  // Use the S3Client and GetObjectCommand to generate a signed URL
  const fileUrl = await getSignedUrl(s3Client, getCommand);

  // Return the generated signed URL
  return fileUrl;
};

// Export the function for use in other parts of the application
module.exports = getFileUrlFromS3;
