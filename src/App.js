import React from "react";
import { LanguageProvider } from "./i18n/LanguageContext";
import Home from "./pages/Home";

function App() {
  return (
    <LanguageProvider>
      <Home />
    </LanguageProvider>
  );
}

export default App;
