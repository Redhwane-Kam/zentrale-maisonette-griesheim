import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AdminLogin from "../components/AdminLogin";
import AdminDashboard from "../components/AdminDashboard";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (checkingSession) {
    return <p style={{ textAlign: "center", marginTop: 60 }}>Chargement...</p>;
  }

  if (!session) {
    return <AdminLogin onLoginSuccess={setSession} />;
  }

  return <AdminDashboard session={session} onLogout={handleLogout} />;
}
