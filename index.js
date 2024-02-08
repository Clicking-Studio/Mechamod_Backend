const express = require("express");
const app = express();
const pool = require("./db");
const cors = require("cors");
const multer = require('multer');
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // => req.body

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

app.post("/keycaps", async (req, res) => {
	try {
		const { name, price, description } = req.body;

		const newKeycap = await pool.query(
			"INSERT INTO keycap (name, price, description) VALUES ($1, $2, $3) RETURNING *",
			[name, price, description],
		);

		res.json(newKeycap.rows[0]);
		console.log("adding keycap");
	} catch (err) {
		console.log(err.message);
	}
});

app.put("/keycaps/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { name, price, description, order_position } = req.body;

		const updateKeycap = await pool.query(
			"UPDATE keycap SET name = $1, price = $2, description = $3, order_position = $4 WHERE keycap_id = $5 RETURNING *",
			[name, price, description, order_position, id],
		);

		res.json(updateKeycap.rows[0]);
		console.log("Updating keycap");
	} catch (err) {
		console.log(err.message);
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
		const { order_position } = req.body;

		const addToCart = await pool.query(
			"UPDATE keycap SET quantity = quantity + 1 WHERE order_position = $1 RETURNING *",
			[order_position],
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
			"SELECT * FROM keycap WHERE quantity > 0",
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
			[id],
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
