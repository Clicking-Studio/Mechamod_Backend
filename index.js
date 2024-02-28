const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "AKIAVRUVSJSTKW2NYYHB",
    secretAccessKey: "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",
  },
});

const PORT = process.env.PORT || 4000;

// Multer setup for image uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 10 MB limit (adjust as needed)
  },
  fileFilter: function (req, file, cb) {
    // Customize your file filter logic if needed
    cb(null, true);
  },
}).array("files", 2); // Allow up to 2 files, adjust as needed

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase JSON request body limit
// Increase payload size limit
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

// Default endpoint
app.get("/", (req, res) => {
  res.send("Deployed");
});

app.get("/keycaps", async (req, res) => {
  try {
    const allKeycaps = await pool.query("SELECT * FROM keycap");
    res.json(allKeycaps.rows);
    console.log("Refreshing keycaps");
  } catch (err) {
    console.log(err);
  }
});

app.get("/keycaps/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const keycap = await pool.query(
      "SELECT * FROM keycap WHERE keycap_id = $1",
      [id]
    );

    if (keycap.rows.length === 0) {
      res.status(404).json({ error: "Keycap not found" });
    } else {
      res.json(keycap.rows[0]);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new keycap
app.post("/keycaps", upload, async (req, res) => {
  try {
    let imageobj = {};
    let stlfileobj = {};

    for (const file of req.files) {
      const keyPrefix = file.mimetype.startsWith("image")
        ? "assets/images/"
        : "assets/stl/";
      const key = `${keyPrefix}${Date.now()}_${path.basename(
        file.originalname
      )}`;

      // Use Upload class for more effective handling of streams of unknown length
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: "tkhattab",
          Key: key,
          Body: file.buffer,
        },
      });

      // Execute the upload
      await upload.done();

      // Generate a signed URL for the uploaded file
      const getCommand = new GetObjectCommand({
        Bucket: "tkhattab",
        Key: key,
      });

      const fileUrl = await getSignedUrl(s3Client, getCommand);

      if (file.mimetype.startsWith("image")) {
        imageobj = { originalname: file.originalname, url: fileUrl };
      } else {
        stlfileobj = { originalname: file.originalname, url: fileUrl };
      }
    }

    const { name, price, description } = req.body;

    const newKeycap = await pool.query(
      "INSERT INTO keycap (name, price, description, image_path) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, price, description, imageobj.url]
    );

    res.json(newKeycap.rows[0]);
    console.log("Adding keycap");
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/keycaps/:id", upload, async (req, res) => {
  try {
    let imageobj = {};
    let stlfileobj = {};

    for (const file of req.files) {
      const keyPrefix = file.mimetype.startsWith("image")
        ? "assets/images/"
        : "assets/stl/";
      const key = `${keyPrefix}${Date.now()}_${path.basename(
        file.originalname
      )}`;

      // Use Upload class for more effective handling of streams of unknown length
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: "tkhattab",
          Key: key,
          Body: file.buffer,
        },
      });

      // Execute the upload
      await upload.done();

      // Generate a signed URL for the uploaded file
      const getCommand = new GetObjectCommand({
        Bucket: "tkhattab",
        Key: key,
      });

      const fileUrl = await getSignedUrl(s3Client, getCommand);

      if (file.mimetype.startsWith("image")) {
        imageobj = { originalname: file.originalname, url: fileUrl };
      } else {
        stlfileobj = { originalname: file.originalname, url: fileUrl };
      }
    }
    const { id } = req.params;
    const { name, price, description, order_position } = req.body;

    const updateKeycap = await pool.query(
      "UPDATE keycap SET name = $1, price = $2, description = $3, order_position = $4, image_path = $5 WHERE keycap_id = $6 RETURNING *",
      [name, price, description, order_position, imageobj.url, id]
    );

    res.json(updateKeycap.rows[0]);
    console.log("Updating keycap");
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/keycaps/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleteKeycap = await pool.query(
      "DELETE FROM keycap WHERE keycap_id = $1",
      [id]
    );

    res.json("keycap was successfully deleted");
    console.log("deleting keycap");
  } catch (err) {
    console.log(err.message);
  }
});

// Add item to the cart
app.post("/cart", async (req, res) => {
  try {
    const { order_position } = req.body;
    const addToCart = await pool.query(
      "UPDATE keycap SET quantity = quantity + 1 WHERE order_position = $1 RETURNING *",
      [order_position]
    );
    res.json(addToCart.rows[0]);
    console.log(`Adding ${addToCart.rows[0].name} to cart`);
  } catch (err) {
    console.error(err.message);
  }
});

// Get cart contents
app.get("/cart", async (req, res) => {
  try {
    const cartContents = await pool.query(
      "SELECT * FROM keycap WHERE quantity > 0"
    );

    res.json(cartContents.rows);
    console.log("Fetching cart contents");
  } catch (err) {
    console.error(err.message);
  }
});

// Remove item from the cart
app.delete("/cart/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleteCartItem = await pool.query(
      "UPDATE keycap SET quantity = GREATEST(quantity - 1, 0) WHERE order_position = $1 RETURNING *",
      [id]
    );

    res.json("Item removed from cart");
    console.log("Removing item from cart");
  } catch (err) {
    console.error(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`server is online at ${PORT}`);
});

// app.listen({ port: PORT, host: "0.0.0.0" }, () => {
// 	console.log(`Server is online at ${PORT}`);
// });
