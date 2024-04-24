// // Import necessary modules
const config = require("../config/config");
let fs = require("fs");
let path = require("path");
const AWS = require("aws-sdk");
const dotenv = require('dotenv')
dotenv.config();

AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region
});
  console.log("🚀 ~ config.region:", config.region)
  console.log("🚀 ~ config.secretAccessKey:", config.secretAccessKey)
  console.log("🚀 ~ config.accessKeyId:", config.accessKeyId)

const s3 = new AWS.S3();

const uploadOns3 = async (params) => {
  return new Promise(async (resolve) => {
    await s3.upload(params, (err, data) => {
      if (err) {
        return resolve({
          status: false,
          message: err,
          
        });
      } else {
        return resolve({
          status: true,
          message: data,
        });
      }
    });
  });
};

const uploadImageOnS3 = async (fileObjArray, pathFolder = "test") => {
  try {
    const fileObj = fileObjArray[0]; // Assuming only one file is uploaded
    // const fileExtension = path.extname(fileObj.originalname);
    const fileName = `${Date.now()}_${path.basename(fileObj.originalname)}`;

    const profileImage = fileName
    const folderName = config.s3BucketFolderName; // assets folder
    const key = `${folderName}/${pathFolder}/${fileName}`; // assets/images/date_nameOfFile.jpg or assets/stl/date_nameOfFile.stl

    const params = {
      Bucket: config.s3BucketName,
      Key: key,
      Body: fileObj.buffer,
      ContentType: fileObj.mimetype,
    };
    console.log("🚀 ~ uploadImageOnS3 ~ params.config.s3BucketName:", config.s3BucketName)
    console.log("🚀 ~ uploadImageOnS3 ~ params:", params.Key)

    await uploadOns3(params);

    return profileImage;
  } catch (error) {
    console.log(error);
    return [];
  }
};


// // Import necessary modules
// const { Upload } = require("@aws-sdk/lib-storage");
// const path = require("path");
// const config = require("../config/config");

// // Import the configured S3Client
// const s3Client = require("./configureClient");

// // Function to upload a file to the specified S3 bucket
// const uploadFileToS3 = async (file) => {
//   // Extract relevant information from the file
//   const folderName = config.s3BucketFolderName; // assets folder
//   const fileName = `${Date.now()}_${path.basename(file.originalname)}`;
//   let keyPrefix = "";
//   let fileGetURLPrefix = "";

//   // Determine the key prefix and file URL prefix based on the file type
//   if (file.mimetype.startsWith("image")) {
//     keyPrefix = "images";
//     fileGetURLPrefix = config.imageURL;
//   } 
//   else if (file.mimetype.startsWith("stl")) {
//     keyPrefix = "stl";
//     fileGetURLPrefix = config.stlURL;
//   }
//   else if (file.mimetype.startsWith("background")) {
//     keyPrefix = "backgrounds";
//     fileGetURLPrefix = config.backgroundURL;
//   }

//   // Construct the S3 key for the file
//   const key = `${folderName}/${keyPrefix}/${fileName}`; // assets/images/date_nameOfFile.jpg or assets/stl/date_nameOfFile.stl

//   // Create an Upload instance with the S3Client and file information
//   const upload = new Upload({
//     client: s3Client,
//     params: {
//       Bucket: config.s3BucketName,
//       Key: key,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//     },
//   });

//   // Perform the upload and wait for it to complete
//   await upload.done();

//   // Return information about the uploaded file, including its URL
//   return {
//     originalname: fileName,
//     url: `${fileGetURLPrefix}/${fileName}`,
//   };
// };

// // Export the function for use in other parts of the application
// module.exports = uploadFileToS3;


module.exports = {
  uploadOns3,
  uploadImageOnS3
};
