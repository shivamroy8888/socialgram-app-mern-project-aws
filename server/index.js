import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
// import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import postRoutes from "./routes/posts.js";
import { register } from "./controllers/auth.js";
import { createPost } from "./controllers/posts.js";
import { verifyToken } from "./middleware/auth.js";
import User from "./models/User.js";
import Post from "./models/Post.js";
import { users, posts } from "./data/index.js";

import fs from "fs";
import AWS from "aws-sdk";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multerS3 from "multer-s3";


import * as dotenv from "dotenv";
dotenv.config();

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// const region = "ap-southeast-2";

// Multer Upload
const s3Config = new AWS.S3({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  Bucket: process.env.bucketName
});

// const s3Client = new S3Client({
//   region: "eu-north-1", // For example, 'us-east-1'
//   credentials: {
//     accessKeyId: process.env.accessKeyId,
//     secretAccessKey: process.env.secretAccessKey,
//   },
// });

// Multer setup
// const upload = multer({
//   storage: multerS3({
//     s3: s3Client,
//     bucket: process.env.bucketName,
//     acl: "public-read", // Access control for the uploaded files. Change as needed.
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: function (req, file, cb) {
//       // Set the file's key (name) in S3
//       const uniquePrefix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, uniquePrefix + "-" + file.originalname);
//     },
//   }),
// });


// async function uploadFileToS3(file) {
//   try {
//     const params = {
//       Bucket: process.env.bucketName,
//       Key: file.originalname,
//       Body: file.buffer,
//       ContentType: file.mimetype,
//       ACL: "public-read", // Access control for the uploaded file. Change as needed.
//     };

//     const command = new PutObjectCommand(params);
//     await s3Client.send(command);

//     console.log(`File uploaded to S3: ${file.originalname}`);
//   } catch (err) {
//     console.error("Error uploading file to S3:", err);
//   }
// }

// const upload = multer();

const multerS3Config = multerS3({
  s3: s3Config,
  bucket: process.env.bucketName,
  metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
      console.log(file)
      cb(null, new Date().toISOString() + '-' + file.originalname)
  }
});

console.log(multerS3Config)

const upload = multer({
  storage: multerS3Config,
  limits: {
      fileSize: 1024 * 1024 * 5 // we are allowing only 5 MB files
  }
})

/* ROUTES WITH FILES */
app.post("/auth/register", upload.single("picture"), register);
app.post("/posts", verifyToken, upload.single("picture"), createPost);

/* ROUTES */
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/posts", postRoutes);

/* MONGOOSE SETUP */
const PORT = process.env.PORT || 3001;
mongoose
  .connect(
    "mongodb+srv://shivam88roy:Ox4lTjNX2BYZUS81@cluster0.gszyoha.mongodb.net/?retryWrites=true&w=majority",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    app.listen(PORT, () => console.log(`Server Port: ${PORT}`));

    /* ADD DATA ONE TIME */
    // User.insertMany(users);
    // Post.insertMany(posts);
  })
  .catch((error) => console.log(`${error} did not connect`));
