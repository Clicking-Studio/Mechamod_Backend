const dotenv = require("dotenv");

dotenv.config();

const config = {
  region: process.env.REGION || "",
  accessKeyId: process.env.ACCESS_KEY_ID || "",
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
  s3BucketName: process.env.S3_BUCKET_NAME || "",
  s3BucketFolderName: process.env.S3_BUCKET_FOLDER_NAME || "",
  imageURL: process.env.IMAGE_URL || "",
  stlURL: process.env.STL_URL || "",
};

module.exports = config;
