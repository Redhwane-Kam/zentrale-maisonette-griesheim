import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import "./ClientHistory.css";

const RATING_CONFIG = {
  excellent: { label: "Excellent", className: "rating-excellent", icon: "✓" },
  correct: { label: "Correct", className: "rating-correct", icon: "•" },
  problematique: { label: "Problématique", className: "rating-problematic", icon: "⚠" }
};

export default function ClientHistory({ reservation }) {
  const [expanded, setExpanded] = useState(false);
  const [client, setClient] = useState(null);
  const [appreciations, setAppreciations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Formulaire d'ajout
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState("correct");
  const [commentaire, setCommentaire] = useState("");
  const [degatsSignales, setDegatsSignales] = useState(false);
  const [saving, setSaving] = useState(false);

  const email = reservation.email_voyageur;

  const fetchClientHistory = useCallback(async () => {
    if (!email) return;
    setLoading(true);

    // Recherche automatique du client par email
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (clientData) {
      setClient(clientData);
      const { data: apprecData } = await supabase
        .from("appreciations_clients")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false });
      setAppreciations(apprecData || []);
    } else {
      setClient(null);
      setAppreciations([]);
    }

    setLoading(false);
  }, [email]);

  useEffect(() => {
    if (expanded) fetchClientHistory();
  }, [expanded, fetchClientHistory]);

  async function handleSaveAppreciation(e) {
    e.preventDefault();
    setSaving(true);

    try {
      let clientId = client?.id;

      // Crée le client s'il n'existe pas encore
      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({
            nom: reservation.nom_voyageur,
            email: reservation.email_voyageur,
            telephone: reservation.telephone_voyageur
          })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;
        setClient(newClient);
      }

      const { error: apprecError } = await supabase
        .from("appreciations_clients")
        .insert({
          client_id: clientId,
          reservation_id: reservation.id,
          rating,
          commentaire,
          degats_signales: degatsSignales
        });

      if (apprecError) throw apprecError;

      setCommentaire("");
      setDegatsSignales(false);
      setRating("correct");
      setShowForm(false);
      fetchClientHistory();
    } catch (err) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      setSaving(false);
    }
  }

  const hasProblematic = appreciations.some((a) => a.rating === "problematique" || a.degats_signales);

  return (
    <div className="client-history">
      <button
        type="button"
        className={`client-history-toggle ${hasProblematic ? "has-warning" : ""}`}
        onClick={() => setExpanded((v) => !v)}
      >
        {hasProblematic && "⚠ "}
        Historique client {expanded ? "▲" : "▼"}
      </button>

      {expanded && (
        <div className="client-history-panel">
          {loading && <p className="client-history-loading">Chargement...</p>}

          {!loading && appreciations.length === 0 && (
            <p className="client-history-empty">Aucun historique pour ce client — première réservation connue.</p>
          )}

          {!loading && appreciations.length > 0 && (
            <ul className="client-history-list">
              {appreciations.map((a) => {
                const cfg = RATING_CONFIG[a.rating] || RATING_CONFIG.correct;
                return (
                  <li key={a.id} className={`client-history-item ${cfg.className}`}>
                    <div className="client-history-item-header">
                      <span className="client-history-rating">{cfg.icon} {cfg.label}</span>
                      {a.degats_signales && <span className="client-history-damage">Dégâts signalés</span>}
                      <span className="client-history-date">
                        {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    {a.commentaire && <p className="client-history-comment">{a.commentaire}</p>}
                  </li>
                );
              })}
            </ul>
          )}

          {!showForm && (
            <button type="button" className="client-history-add-btn" onClick={() => setShowForm(true)}>
              + Ajouter une appréciation
            </button>
          )}

          {showForm && (
            <form className="client-history-form" onSubmit={handleSaveAppreciation}>
              <div className="client-history-rating-choices">
                {Object.entries(RATING_CONFIG).map(([key, cfg]) => (
                  <label key={key} className={`client-history-radio ${rating === key ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="rating"
                      value={key}
                      checked={rating === key}
                      onChange={() => setRating(key)}
                    />
                    {cfg.icon} {cfg.label}
                  </label>
                ))}
              </div>

              <label className="client-history-checkbox">
                <input
                  type="checkbox"
                  checked={degatsSignales}
                  onChange={(e) => setDegatsSignales(e.target.checked)}
                />
                Dégâts signalés
              </label>

              <textarea
                placeholder="Commentaire (facultatif)"
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
              />

              <div className="client-history-form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
