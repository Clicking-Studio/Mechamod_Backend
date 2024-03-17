const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");
const session = require('express-session');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid'); // Import UUID library

if (process.env.NODE_ENV !== "PRODUCTION") {
    require("dotenv").config();
}

// Load environment variables from .env file
const uploadFileToS3 = require("./AWS_S3_OPERATIONS/s3FileUploader");

console.log(process.env.REGION);

const PORT = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB limit
    },
}).array("files", 2); // Allow up to 2 files

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase JSON request body limit
// Increase payload size limit
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static("uploads"));

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
app.post("/keycaps", upload, async (req, res) => {
    try {
        let imageobj = {}; // will contain the URL and the name of the image file that will be uploaded to S3 bucket
        let stlfileobj = {}; // will contain the URL and the name of the STL file that will be uploaded to S3 bucket

        for (const file of req.files) {
            const uploadedFile = await uploadFileToS3(file);

            if (file.mimetype.startsWith("image")) {
                imageobj = uploadedFile;
            } else {
                stlfileobj = uploadedFile;
            }
        }

        const { name, price, description } = req.body;
        const imagePath = imageobj.url; // Path to the uploaded image
        const stlPath = stlfileobj.url; // Path to the uploaded stl

        const newKeycap = await pool.query(
            "INSERT INTO keycap (name, price, description, image_path, stl_path) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, price, description, imagePath, stlPath],
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
        let imageobj = {}; // will contain the URL and the name of the image file that will be uploaded to S3 bucket
        let stlfileobj = {}; // will contain the URL and the name of the STL file that will be uploaded to S3 bucket

        for (const file of req.files) {
            const uploadedFile = await uploadFileToS3(file);

            if (file.mimetype.startsWith("image")) {
                imageobj = uploadedFile;
            } else {
                stlfileobj = uploadedFile;
            }
        }
        const { id } = req.params;
        const { name, price, description, order_position } = req.body;
        const imagePath = imageobj.url; // Path to the uploaded image
        const stlPath = stlfileobj.url; // Path to the uploaded stl

        const updateKeycap = await pool.query(
            "UPDATE keycap SET name = $1, price = $2, description = $3, order_position = $4, image_path = $5, stl_path = $6 WHERE keycap_id = $7 RETURNING *",
            [name, price, description, order_position, imagePath, stlPath, id],
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
            [id],
        );

        res.json("keycap was successfully deleted");
        console.log("deleting keycap");
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.post("/addToCart", async (req, res) => {
    try {
        const { keycap_id } = req.body;
        const sessionID = req.sessionID; // Get session ID from the request session

        // Generate a UUID for cart_id
        const cart_id = uuidv4();

        // Check if the item is already in the user's cart
        const existingCartItem = await pool.query(
            "SELECT * FROM cart WHERE keycap_id = $1 AND session_id = $2",
            [keycap_id, sessionID]
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

            // If the item is not in the user's cart, insert a new entry
            await pool.query(
                "INSERT INTO cart (cart_id, session_id, keycap_id, quantity) VALUES ($1, $2, $3, 1)",
                [cart_id, sessionID, keycap_id]
            );
            console.log(`Item ${keycap_id} added to cart for session ${sessionID}`);

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
        const sessionID = req.sessionID; // Get session ID

        const cartContents = await pool.query(
            "SELECT cart.*, keycap.name, keycap.price, keycap.description, keycap.image_path FROM cart INNER JOIN keycap ON cart.keycap_id = keycap.keycap_id WHERE cart.quantity > 0 AND cart.session_id = $1",
            [sessionID],
        );

        res.json(cartContents.rows);
        console.log(`Fetching cart contents for session ${sessionID}`);
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

// Remove item from the cart
app.delete("/cart/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { cart_id } = req.query
        const deleteCartItem = await pool.query(
            "DELETE FROM cart WHERE id = $1 AND cart_id = $2 RETURNING *",
            [id, cart_id],
        );

        if (deleteCartItem.rowCount > 0) {
            res.json({ message: "Item removed from cart" });
            console.log(`Removing item with ID ${id} from cart with cartId ${cart_id}`);
        } else {
            res.status(404).json({ message: "Item not found in cart" });
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

app.listen(PORT, () => {
    console.log(`server is online at ${PORT}`);
});
