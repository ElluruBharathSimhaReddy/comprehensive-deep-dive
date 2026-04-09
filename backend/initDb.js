const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbDir = path.join(__dirname, "db");
const dbPath = path.join(dbDir, "database.sqlite");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      price REAL NOT NULL CHECK(price > 0),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_inventory_supplier_id
    ON inventory(supplier_id)
  `);

  console.log("Database initialized successfully.");
});

db.close();
