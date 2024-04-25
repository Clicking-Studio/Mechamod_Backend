const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const session = require('express-session');
const crypto = require('crypto');
const { uploadImageOnS3 } = require('./AWS_S3_OPERATIONS/s3FileUploader');

if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config();
}

const config = require('../Mechamod_Backend/config/config');
const PORT = process.env.PORT || 3005;

const storage = multer.memoryStorage();
const upload = multer();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(upload.any());

const generateRandomString = (length) => {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
};

const secretKey = generateRandomString(32); // Generate a 32-character random string
console.log(secretKey);

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));

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
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/keycaps/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const keycap = await pool.query(
            "SELECT * FROM keycap WHERE keycap_id = $1",
            [id],
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
app.post("/keycaps", async (req, res) => {
    try {
        let image, stlImage, backgroundImg

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
             console.log("🚀 ~ app.post ~ req.files:", req.files)
             if (file.fieldname === "image") {
                const uploadedImg = await uploadImageOnS3(
                  [file],
                  "images"
                );
                console.log("🚀 ~ app.post ~ uploadedImg:", uploadedImg)

                image = uploadedImg ? config.imageURL + '/' + uploadedImg: null
              } else if (file.fieldname === "background") {
                const uploadedBackgroundPhoto = await uploadImageOnS3(
                  [file],
                  "backgrounds"
                );
                backgroundImg = uploadedBackgroundPhoto ? config.backgroundURL + '/' + uploadedBackgroundPhoto : null
                }
                else if (file.fieldname === "stl") {
                    const uploadedStlPhoto = await uploadImageOnS3(
                      [file],
                      "stl"
                    );
                    stlImage = uploadedStlPhoto ? config.stlURL + '/' + uploadedStlPhoto : null
                    };
            }
          }

        const { name, price, description, bullet1, bullet2, bullet3, bullet4 } = req.body;
        const imagePath = image // Path to the uploaded image
        const stlPath = stlImage; // Path to the uploaded stl
        const backgroundPath = backgroundImg // path to the uploaded background 

        const newKeycap = await pool.query(
            "INSERT INTO keycap (name, price, description, bullet1, bullet2, bullet3, bullet4, image_path, stl_path, background_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [name, price, description, bullet1, bullet2, bullet3, bullet4, imagePath, stlPath, backgroundPath],
        );

        res.json(newKeycap.rows[0]);
        console.log("Adding keycap");
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.put("/keycaps/:id", async (req, res) => {
    try {
        let imageobj = null; // Will contain the URL and the name of the image file that will be uploaded to S3 bucket
        let stlfileobj = null; // Will contain the URL and the name of the STL file that will be uploaded to S3 bucket
        let backgroundobj = null; // Will contain the URL and the name of the background file that will be uploaded to S3 bucket

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
             if (file.fieldname === "image") {
                const uploadedImg = await uploadImageOnS3(
                  [file],
                  "images"
                );
                console.log("uploaded image",uploadedImg);
                imageobj = uploadedImg ? config.imageURL + '/' + uploadedImg: null
                console.log("imagesssojb",imageobj);
              } else if (file.fieldname === "background") {
                const uploadedBackgroundPhoto = await uploadImageOnS3(
                  [file],
                  "backgrounds"
                );
                backgroundobj = uploadedBackgroundPhoto ? config.backgroundURL + '/' + uploadedBackgroundPhoto : null
                }
                else if (file.fieldname === "stl") {
                    const uploadedStlPhoto = await uploadImageOnS3(
                      [file],
                      "stl"
                    );
                    stlfileobj = uploadedStlPhoto ? config.stlURL + '/' + uploadedStlPhoto : null
                    };
            }
          }
        
        const { id } = req.params;
        const { name, price, description, order_position, bullet1, bullet2, bullet3, bullet4 } = req.body;
        console.log("🚀 ~ app.put ~ req.body:", req.body)

        let imagePath = null; // Initialize imagePath to null
        if (imageobj) {
            // Use the uploaded image URL only if a new image was uploaded
            imagePath = imageobj
            console.log("🚀 ~ app.put ~ imagePath:", imagePath)
        } else {
            // Retrieve the existing image path from the database if no new image was uploaded
            const existingKeycap = await pool.query("SELECT image_path FROM keycap WHERE keycap_id = $1", [id]);
            imagePath = existingKeycap.rows[0].image_path;
            console.log("🚀 ~ app.put esting~ imagePath:", imagePath)
        }

        const stlPath = stlfileobj; // Path to the uploaded STL file

        let backgroundPath = null; // Initialize backgroundPath to null
        if (backgroundobj) {
            // Use the uploaded image URL only if a new image was uploaded
            backgroundPath = backgroundobj
        } else {
            // Retrieve the existing image path from the database if no new image was uploaded
            const existingKeycap = await pool.query("SELECT background_path FROM keycap WHERE keycap_id = $1", [id]);
            backgroundPath = existingKeycap.rows[0].background_path;
        }

        const updateKeycap = await pool.query(
            "UPDATE keycap SET name = $1, price = $2, description = $3, order_position = $4, bullet1 = $5, bullet2 = $6, bullet3 = $7, bullet4 = $8, image_path = $9, stl_path = $10, background_path = $11 WHERE keycap_id = $12 RETURNING *",
            [name, price, description, order_position, bullet1, bullet2, bullet3, bullet4, imagePath, stlPath, backgroundPath, id],
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

        const keycap = await pool.query(
            "SELECT * FROM keycap WHERE keycap_id = $1",
            [id]
        );

        if (keycap.rows.length === 0) {
            return res.status(404).json({ error: "Keycap not found" });
        }

        const deletedKeycap = await pool.query(
            "DELETE FROM keycap WHERE keycap_id = $1 RETURNING *",
            [id]
        );

        // Log keycap deletion
        await pool.query(
            "INSERT INTO logs (action, keycap_name) VALUES ($1, $2)",
            ['Deleted', keycap.rows[0].name]
        );

        res.json({ message: `Keycap ${id} deleted successfully` });
        console.log("Keycap deleted successfully");
    } catch (err) {
        console.error("Error deleting keycap:", err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/addToCart", async (req, res) => {
    try {
        const { keycap_id, session_id } = req.body;
        // const sessionID = req.sessionID; // Get session ID from the request session

        // Check if the item is already in the user's cart
        const existingCartItem = await pool.query(
            "SELECT * FROM cart WHERE keycap_id = $1 AND session_id = $2",
            [keycap_id, session_id]
        );

        if (existingCartItem.rowCount > 0) {
            // If the item is already in the user's cart, return a message
            return res.status(400).json({ message: "Item already exists in your cart" });
        } else {
            // Fetch information about the keycap
            const keycapInfo = await pool.query(
                "SELECT name, price, description, image_path FROM keycap WHERE keycap_id = $1",
                [keycap_id]
            );

            if (keycapInfo.rowCount === 0) {
                // If keycap with given ID does not exist, return an error message
                return res.status(404).json({ message: "Keycap not found" });
            }

            // Insert a new entry into the cart with the session ID
            await pool.query(
                "INSERT INTO cart (session_id, keycap_id, quantity) VALUES ($1, $2, 1)",
                [session_id, keycap_id]
            );
            console.log(`Item ${keycap_id} added to cart for session ${session_id}`);

            // Respond with success message and keycap information
            return res.status(200).json({
                message: "Item added to cart successfully",
                keycap: keycapInfo.rows[0]
            });
        }
    } catch (err) {
        console.error("Error adding item to cart:", err.message);
        res.status(500).json({ message: "Failed to add item to cart" });
    }
});

// Get cart contents
app.get("/getCart", async (req, res) => {
    try {
        const { session_id } = req.query;
        // const sessionID = req.sessionID; // Get session ID

        const cartContents = await pool.query(
            "SELECT cart.*, keycap.name, keycap.price, keycap.description, keycap.image_path FROM cart INNER JOIN keycap ON cart.keycap_id = keycap.keycap_id WHERE cart.quantity > 0 AND cart.session_id = $1",
            [session_id],
        );

        res.json(cartContents.rows);
        console.log(`Fetching cart contents for session ${session_id}`);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

//get all carts 
app.get("/getAllCarts", async (req, res) => {
    try {
        const cartContents = await pool.query(
            "SELECT * FROM cart"
        );

        res.json(cartContents.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Remove item from the cart based on keycap_id and session_id
app.delete("/cart/:keycap_id", async (req, res) => {
    try {
        const { keycap_id } = req.params;
        const { session_id } = req.query;

        const deleteCartItem = await pool.query(
            "DELETE FROM cart WHERE keycap_id = $1 AND session_id = $2 RETURNING *",
            [keycap_id, session_id],
        );

        if (deleteCartItem.rowCount > 0) {
            res.json({ message: `Keycap ${keycap_id} removed from cart for session ${session_id}` });
            console.log(`Removing keycap ${keycap_id} from cart for session ${session_id}`);
        } else {
            res.status(404).json({ message: `Keycap ${keycap_id} not found in cart for session ${session_id}` });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

//update cart
app.put("/cart/:cartId/:itemId", async (req, res) => {
    try {
        const { cartId, itemId } = req.params;
        const { quantity } = req.body;

        const updateCartItem = await pool.query(
            "UPDATE cart SET quantity = $1 WHERE id = $2 AND cart_id = $3 RETURNING *",
            [quantity, itemId, cartId]
        );

        if (updateCartItem.rowCount > 0) {
            res.json({ message: "Cart item updated successfully", updatedItem: updateCartItem.rows[0] });
        } else {
            res.status(404).json({ message: "Item not found in cart" });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

app.delete("/deleteAllCarts", async (req, res) => {
    try {
        // Delete all carts
        await pool.query("DELETE FROM cart");

        // Respond with success message
        res.status(200).json({ message: "All carts deleted successfully" });
    } catch (err) {
        console.error("Error deleting carts:", err.message);
        res.status(500).json({ message: "Failed to delete carts" });
    }
});

// Log keycap actions
app.post("/logs", async (req, res) => {
    try {
        const { action, keycap_name } = req.body;

        const newLog = await pool.query(
            "INSERT INTO logs (action, keycap_name) VALUES ($1, $2) RETURNING *",
            [action, keycap_name]
        );

        res.status(201).json(newLog.rows[0]);
        console.log("Log created successfully");
    } catch (err) {
        console.error("Error creating log:", err.message);
        res.status(500).json({ message: "Failed to create log" });
    }
});

app.get("/logs", async (req, res) => {
    try {
        const logs = await pool.query("SELECT * FROM logs ORDER BY timestamp DESC");
        res.json(logs.rows);
        console.log("Logs fetched successfully");
    } catch (err) {
        console.error("Error fetching logs:", err.message);
        res.status(500).json({ message: "Failed to fetch logs" });
    }
});



app.listen(PORT, () => {
    console.log(`server is online at ${PORT}`);
});
