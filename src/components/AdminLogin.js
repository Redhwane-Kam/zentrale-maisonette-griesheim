import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import "./AdminLogin.css";

// Connexion en deux temps :
// 1) email + mot de passe (1er facteur, via Supabase Auth)
// 2) code à 6 chiffres envoyé par email (2e facteur, via signInWithOtp)
// La session n'est considérée valide qu'après validation des deux étapes.
export default function AdminLogin({ onLoginSuccess }) {
  const [step, setStep] = useState("password"); // "password" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
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
    // session "1er facteur" et on déclenche l'envoi du code par email,
    // pour n'ouvrir une vraie session qu'après validation du code (2e facteur).
    await supabase.auth.signOut();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false }
    });

    setLoading(false);

    if (otpError) {
      setError("Impossible d'envoyer le code de vérification. Réessayez.");
      return;
    }

    setStep("otp");
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "email"
    });

    setLoading(false);

    if (verifyError) {
      setError("Code incorrect ou expiré.");
      return;
    }

    onLoginSuccess(data.session);
  }

  if (step === "otp") {
    return (
      <div className="admin-login-page">
        <form className="admin-login-form" onSubmit={handleOtpSubmit}>
          <h1>Code de vérification</h1>
          <p className="admin-login-subtitle">
            Un code à 6 chiffres a été envoyé à {email}
          </p>

          <label>
            Code reçu par email
            <input
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
              autoFocus
              maxLength={6}
            />
          </label>

          {error && <div className="admin-login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Vérification..." : "Valider"}
          </button>

          <button
            type="button"
            className="admin-login-secondary-btn"
            onClick={() => { setStep("password"); setOtpCode(""); setError(""); }}
          >
            ← Retour
          </button>
        </form>
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
