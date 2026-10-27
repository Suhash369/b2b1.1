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
import Workspace from "./pages/Workspace";
import RecordPlaceholder from "./pages/RecordPlaceholder";
import ComponentShowcase from "./pages/ComponentShowcase";
import NotFound from "./pages/NotFound";
import { CartItem, Product } from "./types";

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: "cart-1",
    product: {
      id: "prod-safety-helmet",
      department: "Safety & PPE",
      title: "Industrial Safety Helmet HDPE (Pack of 50)",
      price: 185,
      mrp: 260,
      sku: "PPE-HLM-001",
      imageUrl: "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      moq: 50,
      hsnCode: "650610",
      supplierName: "Apex SafeTech Ltd",
      leadTime: "3-5 Days",
    },
    quantity: 100,
  },
  {
    id: "cart-2",
    product: {
      id: "prod-carton-boxes",
      department: "Packaging & Logistics",
      title: "Heavy-Duty 5-Ply Corrugated Shipping Boxes",
      price: 32,
      mrp: 45,
      sku: "PKG-BOX-5PLY",
      imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
      inStock: true,
      moq: 200,
      hsnCode: "481910",
      supplierName: "Royale Packaging Pvt Ltd",
      leadTime: "2-4 Days",
    },
    quantity: 500,
  },
];

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
      // fallback to initial
    }
    return INITIAL_CART_ITEMS;
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
            <Route path="/products/:slug" component={() => <RecordPlaceholder kind="product" />} />
            <Route path="/categories/:slug" component={() => <RecordPlaceholder kind="category" />} />
            <Route path="/suppliers/:slug" component={() => <RecordPlaceholder kind="supplier" />} />
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

