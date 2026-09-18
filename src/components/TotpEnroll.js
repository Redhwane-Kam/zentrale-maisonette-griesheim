import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import "./TotpEnroll.css";

// Affiché une seule fois, la première fois que Mariem se connecte,
// pour associer son application Google/Microsoft Authenticator au compte.
export default function TotpEnroll({ onEnrolled }) {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function startEnrollment() {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator"
      });

      if (enrollError) {
        setError("Impossible de démarrer la configuration : " + enrollError.message);
        setLoading(false);
        return;
      }

      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setLoading(false);
    }

    startEnrollment();
  }, []);

  async function handleVerify(e) {
    e.preventDefault();
    setError("");

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId
    });
    if (challengeError) {
      setError("Erreur : " + challengeError.message);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    });

    if (verifyError) {
      setError("Code incorrect. Vérifiez l'heure de votre téléphone et réessayez.");
      return;
    }

    onEnrolled();
  }

  if (loading) {
    return <div className="totp-enroll-page"><p>Préparation...</p></div>;
  }

  return (
    <div className="totp-enroll-page">
      <div className="totp-enroll-card">
        <h1>Configuration de la double authentification</h1>
        <p className="totp-enroll-intro">
          Cette étape n'apparaît qu'une seule fois. Installez <strong>Google Authenticator</strong> (ou
          Microsoft Authenticator) sur votre téléphone, puis scannez ce code :
        </p>

        {qrCode && (
          <div className="totp-qr-wrapper" dangerouslySetInnerHTML={{ __html: qrCode }} />
        )}

        <details className="totp-manual-entry">
          <summary>Je ne peux pas scanner le code</summary>
          <p>Entrez ce code manuellement dans l'application :</p>
          <code>{secret}</code>
        </details>

        <form onSubmit={handleVerify} className="totp-verify-form">
          <label>
            Code à 6 chiffres affiché dans l'application
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </label>

          {error && <div className="totp-error">{error}</div>}

          <button type="submit">Valider et activer</button>
        </form>
      </div>
    </div>
  );
}
