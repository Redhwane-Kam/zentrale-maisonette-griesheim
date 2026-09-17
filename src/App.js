import React from "react";
import { LanguageProvider } from "./i18n/LanguageContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Impressum from "./pages/Impressum";

function App() {
  // Routage simple sans dépendance externe.
  const path = window.location.pathname;

  if (path.startsWith("/admin")) {
    return <Admin />;
  }

  if (path.startsWith("/impressum")) {
    return (
      <LanguageProvider>
        <Impressum />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}

export default App;
