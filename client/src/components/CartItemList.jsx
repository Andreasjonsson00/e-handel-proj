import CartItem from "./CartItem";

const CartItemList = ({
  cart,
  getProductName,
  decreaseQuantity,
  addToCart,
  removeFromCart,
}) => {
  return (
    <>
      {cart.map((item) => (
        <CartItem
          key={item.product.id}
          item={item}
          getProductName={getProductName}
          decreaseQuantity={decreaseQuantity}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      ))}
    </>
  );
};

export default CartItemList;
