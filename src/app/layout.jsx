import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata = {
  title: "HaatBodol (হাতবদল) | Peer-to-Peer Campus Used Goods Marketplace",
  description:
    "Buy and sell pre-owned electronics, furniture, and clothing with fair dynamic depreciation pricing, 70%-85% anti-lowball bargaining, and automated Auto-Drop clearance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F3F4F6] text-gray-900 antialiased">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
