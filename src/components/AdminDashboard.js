import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import ClientHistory from "./ClientHistory";
import "./AdminDashboard.css";

const STATUS_LABELS = {
  en_attente: { text: "En attente", className: "status-pending" },
  confirmee: { text: "Confirmée", className: "status-confirmed" },
  annulee: { text: "Annulée", className: "status-cancelled" },
  bloquee: { text: "Bloquée", className: "status-blocked" }
};

export default function AdminDashboard({ session, onLogout }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("toutes");

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .order("date_arrivee", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setReservations(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from("reservations")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
      return;
    }
    fetchReservations();
  }

  async function updateRemise(id, remisePourcentage) {
    const { error } = await supabase
      .from("reservations")
      .update({ remise_pourcentage: remisePourcentage, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Erreur lors de la mise à jour de la remise : " + error.message);
      return;
    }
    fetchReservations();
  }

  async function generateInvoice(reservation) {
    const numeroFacture = window.prompt(
      "Numéro de facture (ex: RE-2026-0001) :",
      ""
    );
    if (!numeroFacture) return; // annulé par la fille

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    try {
      const response = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.id,
          numeroFacture,
          accessToken
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur inconnue");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rechnung-${numeroFacture}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Erreur lors de la génération de la facture : " + err.message);
    }
  }

  const filteredReservations = reservations.filter((r) => {
    if (filter === "toutes") return true;
    return r.status === filter;
  });

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Zentrale Maisonette Griesheim — Gestion</h1>
        <button className="admin-logout-btn" onClick={onLogout}>Déconnexion</button>
      </header>

      <div className="admin-filters">
        {["toutes", "en_attente", "confirmee", "annulee", "bloquee"].map((f) => (
          <button
            key={f}
            className={`admin-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "toutes" ? "Toutes" : STATUS_LABELS[f].text}
          </button>
        ))}
      </div>

      {loading && <p className="admin-loading">Chargement...</p>}

      {!loading && filteredReservations.length === 0 && (
        <p className="admin-empty">Aucune réservation dans cette catégorie.</p>
      )}

      <div className="admin-reservations-list">
        {filteredReservations.map((r) => (
          <div key={r.id} className="admin-reservation-card">
            <div className="admin-reservation-header">
              <span className={`admin-status-badge ${STATUS_LABELS[r.status]?.className}`}>
                {STATUS_LABELS[r.status]?.text || r.status}
              </span>
              <span className="admin-reservation-dates">
                {r.date_arrivee} → {r.date_depart}
              </span>
            </div>

            <div className="admin-reservation-body">
              <p><strong>{r.nom_voyageur || "—"}</strong> · {r.nombre_voyageurs} voyageur(s)</p>
              <p className="admin-contact">{r.email_voyageur} {r.telephone_voyageur && `· ${r.telephone_voyageur}`}</p>
              <p className="admin-price">
                {r.prix_total ? `${r.prix_total}€` : "—"}
                {r.tarif_non_remboursable && " (non remboursable)"}
                {r.remise_pourcentage > 0 && ` · remise ${r.remise_pourcentage}%`}
              </p>
              {r.message_voyageur && (
                <p className="admin-motivation">« {r.message_voyageur} »</p>
              )}
            </div>

            <div className="admin-reservation-actions">
              {r.status === "en_attente" && (
                <>
                  <button className="admin-btn-confirm" onClick={() => updateStatus(r.id, "confirmee")}>
                    Confirmer
                  </button>
                  <button className="admin-btn-cancel" onClick={() => updateStatus(r.id, "annulee")}>
                    Refuser
                  </button>
                </>
              )}
              {r.status === "confirmee" && (
                <button className="admin-btn-cancel" onClick={() => updateStatus(r.id, "annulee")}>
                  Annuler
                </button>
              )}

              <select
                className="admin-remise-select"
                value={r.remise_pourcentage || 0}
                onChange={(e) => updateRemise(r.id, Number(e.target.value))}
              >
                <option value={0}>Pas de remise</option>
                <option value={5}>Remise 5%</option>
                <option value={10}>Remise 10%</option>
              </select>

              {r.status === "confirmee" && (
                <button className="admin-btn-invoice" onClick={() => generateInvoice(r)}>
                  📄 Facture
                </button>
              )}
            </div>

            <ClientHistory reservation={r} />
          </div>
        ))}
      </div>
    </div>
  );
}
