import React from "react";
import { LanguageProvider } from "./i18n/LanguageContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Impressum from "./pages/Impressum";

function App() {
  // Routage simple sans dépendance externe.
  // L'URL du back-office est volontairement discrète (/mawka3 plutôt
  // que /admin) pour limiter le ciblage automatique par les robots —
  // ce n'est qu'une mesure complémentaire, pas une vraie protection.
  const path = window.location.pathname;

  if (path.startsWith("/mawka3")) {
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
