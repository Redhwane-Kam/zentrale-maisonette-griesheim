import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminLogin.css";

// Connexion en deux temps (v1 - test, en attendant un SMTP personnalisé
// pour passer à un vrai code à 6 chiffres saisi manuellement) :
// 1) email + mot de passe (1er facteur, via Supabase Auth)
// 2) lien de connexion envoyé par email (2e facteur) : cliquer dessus
//    ramène l'utilisateur sur /admin avec une session déjà active.
export default function AdminLogin({ onLoginSuccess }) {
  const [step, setStep] = useState("password"); // "password" | "waiting-link"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Étape 1 : vérifie email + mot de passe
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setLoading(false);
      setError("Identifiant ou mot de passe incorrect.");
      return;
    }

    // Le mot de passe est correct : on se déconnecte immédiatement de cette
    // session "1er facteur" et on envoie le lien de connexion (2e facteur).
    // Tant que ce lien n'est pas cliqué, aucune vraie session n'est ouverte.
    await supabase.auth.signOut();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin`
      }
    });

    setLoading(false);

    if (otpError) {
      setError("Impossible d'envoyer le lien de vérification. Réessayez.");
      return;
    }

    setStep("waiting-link");
  }

  if (step === "waiting-link") {
    return (
      <div className="admin-login-page">
        <div className="admin-login-form">
          <h1>Vérifiez vos emails</h1>
          <p className="admin-login-subtitle">
            Un lien de connexion a été envoyé à {email}.<br />
            Cliquez dessus pour accéder à l'espace de gestion.
          </p>

          <button
            type="button"
            className="admin-login-secondary-btn"
            onClick={() => { setStep("password"); setError(""); }}
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-form" onSubmit={handlePasswordSubmit}>
        <h1>Espace de gestion</h1>
        <p className="admin-login-subtitle">Zentrale Maisonette Griesheim</p>

        <label>
          Identifiant (email)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </label>

        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="admin-login-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Vérification..." : "Continuer"}
        </button>
      </form>
    </div>
  );
}
