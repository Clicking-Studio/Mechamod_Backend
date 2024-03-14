const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const multer = require("multer");
const bodyParser = require("body-parser");

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
	}
});

// Add item to the cart
app.post("/cart", async (req, res) => {
    try {
        const { keycap_id } = req.body;
        const sessionID = req.sessionID; // Get session ID
        const cartID = `guest-${sessionID}`;

        const addToCart = await pool.query(
            "UPDATE cart SET quantity = quantity + 1 WHERE keycap_id = $1 AND cart_id = $2 RETURNING *",
            [keycap_id, cartID],
        );

        res.json(addToCart.rows[0]);
        console.log(`Adding item to cart for session ${sessionID}`);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get cart contents
app.get("/cart", async (req, res) => {
    try {
        const sessionID = req.sessionID; // Get session ID
        const cartID = `guest-${sessionID}`;

        const cartContents = await pool.query(
            "SELECT * FROM cart WHERE quantity > 0 AND cart_id = $1",
            [cartID],
        );

        res.json(cartContents.rows);
        console.log(`Fetching cart contents for session ${sessionID}`);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});

// Remove item from the cart
app.delete("/cart/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const sessionID = req.sessionID; // Get session ID
        const cartID = `guest-${sessionID}`;

        const deleteCartItem = await pool.query(
            "UPDATE cart SET quantity = GREATEST(quantity - 1, 0) WHERE keycap_id = $1 AND cart_id = $2 RETURNING *",
            [id, cartID],
        );

        res.json("Item removed from cart");
        console.log(`Removing item from cart for session ${sessionID}`);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: "Server Error" });
    }
});



app.listen(PORT, () => {
	console.log(`server is online at ${PORT}`);
});

// app.listen({ port: PORT, host: "0.0.0.0" }, () => {
// 	console.log(`Server is online at ${PORT}`);
// });
