import React, { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import Enterprises from "./pages/Enterprises";
import Services from "./pages/Services";
import Networks from "./pages/Networks";
import Subscription from "./pages/Subscription";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Suppliers from "./pages/Suppliers";
import ProductDetail from "./pages/ProductDetail";
import Workspace from "./pages/Workspace";
import RecordPlaceholder from "./pages/RecordPlaceholder";
import ComponentShowcase from "./pages/ComponentShowcase";
import NotFound from "./pages/NotFound";
import { CartItem, Product } from "./types";

const workspaceRoutes = [
  "/verify-email", "/forgot-password",
  "/buyer/dashboard", "/buyer/cart", "/buyer/checkout", "/buyer/orders", "/buyer/orders/:id",
  "/buyer/rfqs", "/buyer/rfqs/:id", "/buyer/quotes", "/buyer/messages", "/buyer/settings",
  "/supplier/onboarding", "/supplier/dashboard", "/supplier/products", "/supplier/products/new",
  "/supplier/inventory", "/supplier/rfqs", "/supplier/quotes", "/supplier/orders", "/supplier/messages", "/supplier/settings",
  "/admin/dashboard", "/admin/users", "/admin/suppliers", "/admin/products", "/admin/orders", "/admin/disputes", "/admin/categories", "/admin/settings",
];

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("bazrokart_procurement_cart");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("bazrokart_procurement_cart", JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      const newItem: CartItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product,
        quantity,
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/">
              {() => (
                <Home
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onRemoveCartItem={handleRemoveCartItem}
                />
              )}
            </Route>

            <Route path="/products">
              {() => (
                <Catalog
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onRemoveCartItem={handleRemoveCartItem}
                />
              )}
            </Route>

            <Route path="/enterprises">
              {() => <Enterprises cartItems={cartItems} />}
            </Route>

            <Route path="/services">
              {() => <Services cartItems={cartItems} />}
            </Route>

            <Route path="/networks">
              {() => <Networks cartItems={cartItems} />}
            </Route>

            <Route path="/subscription">
              {() => <Subscription cartItems={cartItems} />}
            </Route>

            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />

            <Route path="/suppliers" component={Suppliers} />
            <Route path="/products/:slug">
              {() => (
                <ProductDetail
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onRemoveCartItem={handleRemoveCartItem}
                />
              )}
            </Route>
            <Route path="/categories/:slug" component={() => <Catalog cartItems={cartItems} onAddToCart={handleAddToCart} />} />
            <Route path="/suppliers/:slug" component={Suppliers} />
            <Route path="/showcase" component={ComponentShowcase} />

            {workspaceRoutes.map((path) => (
              <Route key={path} path={path}>
                {() => <Workspace cartItems={cartItems} />}
              </Route>
            ))}

            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

