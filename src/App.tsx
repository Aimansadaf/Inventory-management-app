import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import ProductForm from "@/pages/ProductForm";
import BarcodePage from "@/pages/BarcodePage";
import ScanPage from "@/pages/ScanPage";
import ManageStaff from "@/pages/ManageStaff";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/new" element={<ProtectedRoute adminOnly><ProductForm /></ProtectedRoute>} />
              <Route path="/products/edit/:id" element={<ProtectedRoute adminOnly><ProductForm /></ProtectedRoute>} />
              <Route path="/barcode" element={<BarcodePage />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/staff" element={<ProtectedRoute adminOnly><ManageStaff /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
