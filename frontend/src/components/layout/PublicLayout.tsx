import { Outlet } from "react-router";
import Navbar from "@/components/home/Navbar";
import Footer from "@/components/home/Footer";

const PublicLayout = () => {
  return (
    <div className="public-marketing flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
