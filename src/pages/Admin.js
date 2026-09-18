import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminLogin from "../components/AdminLogin";
import AdminDashboard from "../components/AdminDashboard";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [mfaSatisfied, setMfaSatisfied] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  async function checkMfaLevel() {
    // Indique si la session actuelle a réellement validé son second facteur
    // (TOTP), pas seulement le mot de passe — nécessaire même quand une
    // session existante traîne déjà dans le navigateur.
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) {
      setMfaSatisfied(false);
      return;
    }
    // "aal2" = un second facteur a bien été vérifié pour cette session.
    setMfaSatisfied(data.currentLevel === "aal2");
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        await checkMfaLevel();
      }
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await checkMfaLevel();
      } else {
        setMfaSatisfied(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
    setMfaSatisfied(false);
  }

  function handleLoginSuccess() {
    // Après une connexion réussie (mot de passe + TOTP validés dans
    // AdminLogin), on relit la session et son niveau d'assurance MFA.
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await checkMfaLevel();
    });
  }

  if (checkingSession) {
    return <p style={{ textAlign: "center", marginTop: 60 }}>Chargement...</p>;
  }

  if (!session || !mfaSatisfied) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard session={session} onLogout={handleLogout} />;
}
