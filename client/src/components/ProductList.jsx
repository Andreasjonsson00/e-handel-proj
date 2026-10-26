import ProductCard from "./ProductCard";

const ProductList = ({ products, addToCart, getProductName }) => {
  return (
    <>
      {products.data.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          addToCart={addToCart}
          getProductName={getProductName}
        />
      ))}
    </>
  );
};

export default ProductList;
