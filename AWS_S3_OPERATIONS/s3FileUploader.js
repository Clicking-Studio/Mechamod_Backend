const { Upload } = require("@aws-sdk/lib-storage");
const path = require("path");
const config = require("../config/config");
const s3Client = require("./configureClient");

const uploadFileToS3 = async (file) => {
  const folderName = config.s3BucketFolderName;
  const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
  let keyPrefix = "";
  let fileGetURLPrefix = "";
  if (file.mimetype.startsWith("image")) {
    keyPrefix = "images";
    fileGetURLPrefix = config.imageURL;
  } else {
    keyPrefix = "stl";
    fileGetURLPrefix = config.stlURL;
  }
  const key = `${folderName}/${keyPrefix}/${fileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.s3BucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  });

  await upload.done();

  return {
    originalname: fileName,
    url: `${fileGetURLPrefix}/${fileName}`,
  };
};

module.exports = uploadFileToS3;
