import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const hash = '@GoMarketPlace';

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const response = await AsyncStorage.getItem(`${hash}:products`);
      if (response) {
        setProducts(JSON.parse(response));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const index = products.findIndex(product => product.id === id);
      if (index !== -1) {
        const newProducts = [...products];
        const newQuantity = newProducts[index].quantity + 1;
        newProducts[index] = {
          ...newProducts[index],
          quantity: newQuantity,
        };

        setProducts(() => newProducts);
        AsyncStorage.setItem(`${hash}:products`, JSON.stringify(newProducts));
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(product => product.id === id);
      if (index === -1) {
        return;
      }

      const newProducts = [...products];
      const updatedProduct = { ...newProducts[index] };
      if (updatedProduct.quantity === 1) {
        newProducts.splice(index, 1);
      }

      if (products[index].quantity > 1) {
        updatedProduct.quantity -= 1;
      }

      newProducts[index] = updatedProduct;

      setProducts(() => newProducts);
      AsyncStorage.setItem(`${hash}:products`, JSON.stringify(newProducts));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const index = products.findIndex(({ id }) => product.id === id);
      if (index !== -1) {
        increment(product.id);
        return;
      }

      const newProduct = { ...product, quantity: 1 };
      const newProducts = [...products, newProduct];
      setProducts(prevProducts => [...prevProducts, newProduct]);
      AsyncStorage.setItem(`${hash}:products`, JSON.stringify(newProducts));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
