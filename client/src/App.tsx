// =============================================================
// DESIGN SYSTEM: Industrial Ledger
// App: Admin routes inside Layout, Shop routes standalone
// =============================================================

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Reports from "./pages/Reports";
import Expenses from "./pages/Expenses";
import OnlineOrders from "./pages/OnlineOrders";
import ShopComingSoon from "./pages/ShopComingSoon";
// Shop, ShopCart, ShopCheckout temporarily disabled
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public Shop Routes — temporarily disabled, showing Coming Soon */}
      <Route path="/shop" component={ShopComingSoon} />
      <Route path="/shop/cart" component={ShopComingSoon} />
      <Route path="/shop/checkout" component={ShopComingSoon} />

      {/* Admin Routes (with sidebar Layout) */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products" component={Products} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/sales" component={Sales} />
            <Route path="/suppliers" component={Suppliers} />
            <Route path="/purchase-orders" component={PurchaseOrders} />
            <Route path="/online-orders" component={OnlineOrders} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/reports" component={Reports} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <CartProvider>
          <TooltipProvider>
            <Toaster position="bottom-right" />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
