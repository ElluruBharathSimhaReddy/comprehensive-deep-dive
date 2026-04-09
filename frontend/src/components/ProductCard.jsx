function ProductCard({ product }) {
  return (
    <div className="card">
      <div className="badge">{product.category}</div>
      <h3>{product.productName}</h3>
      <p><strong>Price:</strong> ${product.price}</p>
      <p><strong>Supplier:</strong> {product.supplier}</p>
    </div>
  );
}

export default ProductCard;
