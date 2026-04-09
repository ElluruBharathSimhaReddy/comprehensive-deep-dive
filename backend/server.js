const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const inventoryFilePath = path.join(__dirname, "data", "inventory.json");
const dbPath = path.join(__dirname, "db", "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  }
});

app.get("/", (req, res) => {
  res.send("Zeerostock backend is running");
});

// ----------------------------
// Part A: Search API
// ----------------------------
app.get("/search", (req, res) => {
  try {
    const { q, category, minPrice, maxPrice } = req.query;
    const rawData = fs.readFileSync(inventoryFilePath, "utf-8");
    const inventory = JSON.parse(rawData);

    if (
      minPrice !== undefined &&
      minPrice !== "" &&
      maxPrice !== undefined &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        message: "Minimum price cannot be higher than maximum."
      });
    }

    let filtered = [...inventory];

    if (q) {
      filtered = filtered.filter((item) =>
        item.productName.toLowerCase().includes(String(q).toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter(
        (item) => item.category.toLowerCase() === String(category).toLowerCase()
      );
    }

    if (minPrice !== undefined && minPrice !== "") {
      filtered = filtered.filter(
        (item) => Number(item.price) >= Number(minPrice)
      );
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      filtered = filtered.filter(
        (item) => Number(item.price) <= Number(maxPrice)
      );
    }

    return res.json(filtered);
  } catch (error) {
    console.error("Search API error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ----------------------------
// Part B: Supplier APIs
// ----------------------------
app.post("/supplier", (req, res) => {
  const { name, city } = req.body;

  if (!name || !city) {
    return res.status(400).json({
      message: "Name and city are required"
    });
  }

  const query = `INSERT INTO suppliers (name, city) VALUES (?, ?)`;

  db.run(query, [name, city], function (err) {
    if (err) {
      console.error("Supplier insert error:", err.message);
      return res.status(500).json({ message: "Failed to add supplier" });
    }

    return res.status(201).json({
      message: "Supplier added successfully",
      supplier: {
        id: this.lastID,
        name,
        city
      }
    });
  });
});

app.get("/suppliers", (req, res) => {
  db.all(`SELECT * FROM suppliers ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
      console.error("Fetch suppliers error:", err.message);
      return res.status(500).json({ message: "Failed to fetch suppliers" });
    }

    return res.json(rows);
  });
});

// ----------------------------
// Part B: Inventory APIs
// ----------------------------
app.post("/inventory", (req, res) => {
  const { supplier_id, product_name, quantity, price } = req.body;

  if (
    !supplier_id ||
    !product_name ||
    quantity === undefined ||
    price === undefined
  ) {
    return res.status(400).json({
      message: "supplier_id, product_name, quantity, and price are required"
    });
  }

  if (Number(quantity) < 0) {
    return res.status(400).json({
      message: "Quantity must be 0 or more"
    });
  }

  if (Number(price) <= 0) {
    return res.status(400).json({
      message: "Price must be greater than 0"
    });
  }

  db.get(`SELECT * FROM suppliers WHERE id = ?`, [supplier_id], (err, supplier) => {
    if (err) {
      console.error("Supplier lookup error:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (!supplier) {
      return res.status(400).json({
        message: "Invalid supplier_id"
      });
    }

    const query = `
      INSERT INTO inventory (supplier_id, product_name, quantity, price)
      VALUES (?, ?, ?, ?)
    `;

    db.run(query, [supplier_id, product_name, quantity, price], function (insertErr) {
      if (insertErr) {
        console.error("Inventory insert error:", insertErr.message);
        return res.status(500).json({ message: "Failed to add inventory" });
      }

      return res.status(201).json({
        message: "Inventory added successfully",
        inventory: {
          id: this.lastID,
          supplier_id,
          product_name,
          quantity,
          price
        }
      });
    });
  });
});

app.get("/inventory", (req, res) => {
  const query = `
    SELECT 
      i.id,
      i.product_name,
      i.quantity,
      i.price,
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.city AS supplier_city
    FROM inventory i
    JOIN suppliers s ON i.supplier_id = s.id
    ORDER BY i.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Fetch inventory error:", err.message);
      return res.status(500).json({ message: "Failed to fetch inventory" });
    }

    return res.json(rows);
  });
});

app.get("/inventory/grouped", (req, res) => {
  const query = `
    SELECT
      s.id AS supplier_id,
      s.name AS supplier_name,
      s.city AS supplier_city,
      SUM(i.quantity * i.price) AS total_inventory_value
    FROM suppliers s
    JOIN inventory i ON s.id = i.supplier_id
    GROUP BY s.id, s.name, s.city
    ORDER BY total_inventory_value DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Grouped inventory error:", err.message);
      return res.status(500).json({ message: "Failed to fetch grouped inventory" });
    }

    return res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
