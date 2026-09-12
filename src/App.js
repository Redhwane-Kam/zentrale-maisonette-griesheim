import React from "react";
import { LanguageProvider } from "./i18n/LanguageContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";

function App() {
  // Routage simple sans dépendance externe : /admin affiche le back-office,
  // toute autre URL affiche le site public.
  const isAdminRoute = window.location.pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <Admin />;
  }

  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}

export default App;
