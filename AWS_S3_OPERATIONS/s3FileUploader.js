// Import necessary modules
const { Upload } = require("@aws-sdk/lib-storage");
const path = require("path");
const config = require("../config/config");

// Import the configured S3Client
const s3Client = require("./configureClient");

// Function to upload a file to the specified S3 bucket
const uploadFileToS3 = async (file) => {
  // Extract relevant information from the file
  const folderName = config.s3BucketFolderName; // assets folder
  const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
  let keyPrefix = "";
  let fileGetURLPrefix = "";

  // Determine the key prefix and file URL prefix based on the file type
  if (file.mimetype.startsWith("image")) {
    keyPrefix = "images";
    fileGetURLPrefix = config.imageURL;
  } else {
    keyPrefix = "stl";
    fileGetURLPrefix = config.stlURL;
  }

  // Construct the S3 key for the file
  const key = `${folderName}/${keyPrefix}/${fileName}`; // assets/images/date_nameOfFile.jpg or assets/stl/date_nameOfFile.stl

  // Create an Upload instance with the S3Client and file information
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.s3BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  // Perform the upload and wait for it to complete
  await upload.done();

  // Return information about the uploaded file, including its URL
  return {
    originalname: fileName,
    url: `${fileGetURLPrefix}/${fileName}`,
  };
};

// Export the function for use in other parts of the application
module.exports = uploadFileToS3;
