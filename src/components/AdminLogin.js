import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import TotpEnroll from "./TotpEnroll";
import "./AdminLogin.css";

// Connexion en deux temps :
// 1) email + mot de passe (1er facteur)
// 2) TOTP (application authenticator) si déjà configuré,
//    sinon écran de première configuration (TotpEnroll).
// Un lien de secours permet de recevoir un code par email si le
// téléphone n'est pas disponible (utilise le flux OTP par lien existant).
export default function AdminLogin({ onLoginSuccess }) {
  const [step, setStep] = useState("password"); // "password" | "totp-verify" | "totp-enroll" | "email-fallback-sent"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [factorId, setFactorId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setLoading(false);
      setError("Identifiant ou mot de passe incorrect.");
      return;
    }

    // Vérifie si un facteur TOTP est déjà enregistré pour ce compte
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    setLoading(false);

    if (factorsError) {
      setError("Erreur : " + factorsError.message);
      return;
    }

    const verifiedTotp = factorsData?.totp?.find((f) => f.status === "verified");

    if (verifiedTotp) {
      setFactorId(verifiedTotp.id);
      setStep("totp-verify");
    } else {
      // Première connexion : pas encore de TOTP configuré
      setStep("totp-enroll");
    }
  }

  async function handleTotpVerify(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    });
    if (challengeError) {
      setLoading(false);
      setError("Erreur : " + challengeError.message);
      return;
    }

    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: totpCode
    });

    setLoading(false);

    if (verifyError) {
      setError("Code incorrect. Vérifiez l'heure de votre téléphone.");
      return;
    }

    onLoginSuccess(verifyData);
  }

  async function handleEmailFallback() {
    setError("");
    await supabase.auth.signOut();

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`
      }
    });

    if (otpError) {
      setError("Impossible d'envoyer le lien de secours.");
      return;
    }
    setStep("email-fallback-sent");
  }

  if (step === "totp-enroll") {
    return (
      <TotpEnroll
        onEnrolled={() => {
          // Une fois le TOTP configuré, la session en cours est déjà active
          supabase.auth.getSession().then(({ data }) => onLoginSuccess(data.session));
        }}
      />
    );
  }

  if (step === "totp-verify") {
    return (
      <div className="admin-login-page">
        <form className="admin-login-form" onSubmit={handleTotpVerify}>
          <h1>Code de l'application</h1>
          <p className="admin-login-subtitle">
            Ouvrez votre application Authenticator et saisissez le code affiché
          </p>

          <label>
            Code à 6 chiffres
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              required
              autoFocus
            />
          </label>

          {error && <div className="admin-login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Vérification..." : "Valider"}
          </button>

          <button
            type="button"
            className="admin-login-secondary-btn"
            onClick={handleEmailFallback}
          >
            Je n'ai pas accès à mon téléphone
          </button>
        </form>
      </div>
    );
  }

  if (step === "email-fallback-sent") {
    return (
      <div className="admin-login-page">
        <div className="admin-login-form">
          <h1>Vérifiez vos emails</h1>
          <p className="admin-login-subtitle">
            Un lien de connexion de secours a été envoyé à {email}.
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
          Identifiant
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
