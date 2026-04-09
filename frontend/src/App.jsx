import React, { useEffect, useState } from "react";
import ProductCard from "./components/ProductCard";

const API_BASE = "http://127.0.0.1:5000";

function App() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [products, setProducts] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [suppliers, setSuppliers] = useState([]);
  const [inventoryRows, setInventoryRows] = useState([]);
  const [groupedRows, setGroupedRows] = useState([]);

  const [supplierName, setSupplierName] = useState("");
  const [supplierCity, setSupplierCity] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const [message, setMessage] = useState("");

  const categories = ["Furniture", "Electronics", "Stationery", "Office"];

  const fetchProducts = async () => {
    setSearchLoading(true);
    setSearchError("");

    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (category) params.append("category", category);
      if (minPrice !== "") params.append("minPrice", minPrice);
      if (maxPrice !== "") params.append("maxPrice", maxPrice);

      const response = await fetch(`${API_BASE}/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch products");
      }

      setProducts(data);
    } catch (error) {
      setSearchError(error.message);
      setProducts([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${API_BASE}/suppliers`);
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Failed to load suppliers", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory`);
      const data = await response.json();
      setInventoryRows(data);
    } catch (error) {
      console.error("Failed to load inventory", error);
    }
  };

  const fetchGrouped = async () => {
    try {
      const response = await fetch(`${API_BASE}/inventory/grouped`);
      const data = await response.json();
      setGroupedRows(data);
    } catch (error) {
      console.error("Failed to load grouped inventory", error);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchSuppliers(), fetchInventory(), fetchGrouped()]);
  };

  useEffect(() => {
    fetchProducts();
    refreshAll();
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    await fetchProducts();
  };

  const handleSearchClear = async () => {
    setQ("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSearchError("");

    setTimeout(() => {
      fetch(`${API_BASE}/search`)
        .then((res) => res.json())
        .then((data) => setProducts(data))
        .catch(() => setProducts([]));
    }, 0);
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/supplier`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: supplierName,
          city: supplierCity
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add supplier");
      }

      setMessage("Supplier added successfully.");
      setSupplierName("");
      setSupplierCity("");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          supplier_id: Number(supplierId),
          product_name: productName,
          quantity: Number(quantity),
          price: Number(price)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add inventory");
      }

      setMessage("Inventory added successfully.");
      setSupplierId("");
      setProductName("");
      setQuantity("");
      setPrice("");
      await refreshAll();
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <h1>Zeerostock Inventory Assignment</h1>
        <p>
          Complete full-stack project with search filters, supplier APIs,
          inventory APIs, and grouped inventory value.
        </p>
      </header>

      <section className="panel">
        <h2>Part A: Inventory Search</h2>
        <form className="grid-form" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search by product name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />

          <input
            type="number"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <div className="actions">
            <button type="submit">Search</button>
            <button type="button" className="secondary" onClick={handleSearchClear}>
              Clear
            </button>
          </div>
        </form>

        {searchLoading && <p className="info">Loading products...</p>}
        {searchError && <p className="error">{searchError}</p>}

        {!searchLoading && !searchError && products.length === 0 && (
          <p className="info">Sorry, we couldn't find any products matching your criteria.</p>
        )}

        <div className="cards">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="split">
        <div className="panel">
          <h2>Part B: Add Supplier</h2>
          <form className="stack-form" onSubmit={handleAddSupplier}>
            <input
              type="text"
              placeholder="Supplier name"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="City"
              value={supplierCity}
              onChange={(e) => setSupplierCity(e.target.value)}
              required
            />
            <button type="submit">Add Supplier</button>
          </form>
        </div>

        <div className="panel">
          <h2>Part B: Add Inventory</h2>
          <form className="stack-form" onSubmit={handleAddInventory}>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} - {supplier.city}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Product name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />

            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />

            <button type="submit">Add Inventory</button>
          </form>
        </div>
      </section>

      {message && <p className="status">{message}</p>}

      <section className="panel">
        <h2>Suppliers</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>City</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.id}</td>
                    <td>{supplier.name}</td>
                    <td>{supplier.city}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No suppliers added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Inventory Records</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Supplier</th>
                <th>City</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRows.length > 0 ? (
                inventoryRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.product_name}</td>
                    <td>{row.quantity}</td>
                    <td>${Number(row.price).toFixed(2)}</td>
                    <td>{row.supplier_name}</td>
                    <td>{row.supplier_city}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No inventory added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Grouped Inventory by Supplier</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier ID</th>
                <th>Supplier Name</th>
                <th>City</th>
                <th>Total Inventory Value</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.length > 0 ? (
                groupedRows.map((row) => (
                  <tr key={row.supplier_id}>
                    <td>{row.supplier_id}</td>
                    <td>{row.supplier_name}</td>
                    <td>{row.supplier_city}</td>
                    <td>${Number(row.total_inventory_value).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">No grouped data available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default App;
