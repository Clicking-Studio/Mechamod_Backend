const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require("../config/config");

const s3Client = require("./configureClient");

const getFileUrlFromS3 = async (key) => {
  const getCommand = new GetObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
  });

  const fileUrl = await getSignedUrl(s3Client, getCommand);

  return fileUrl;
};

module.exports = getFileUrlFromS3;
