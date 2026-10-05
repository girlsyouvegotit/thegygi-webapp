import { RouterProvider } from "react-router";
import { router } from "@/pages/routes/router";
import { Toaster } from "@/components/ui/sonner";
import AppErrorBoundary from "@/components/errors/AppErrorBoundary";

const App = () => {
  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AppErrorBoundary>
  );
};

export default App;