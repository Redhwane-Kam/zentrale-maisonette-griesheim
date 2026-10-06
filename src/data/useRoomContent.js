import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Ordre d'affichage des pièces sur le site public (même ordre que le back-office).
export const ROOM_ORDER = [
  "salon",
  "suiteParentale",
  "chambreEnfants",
  "cuisine",
  "secondeSdb",
  "entree",
  "facade",
  "parking"
];

// Charge le contenu des pièces (photos, équipements, commentaires) depuis
// Supabase, pour que les modifications faites par Mariem au back-office
// apparaissent sur le site sans nouveau déploiement.
export function useRoomContent() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase.from("room_content").select("*");
      if (cancelled) return;

      if (error) {
        console.error(error);
        setRooms([]);
      } else {
        const byKey = {};
        (data || []).forEach((r) => {
          byKey[r.room_key] = r;
        });
        const ordered = ROOM_ORDER.map((key) => byKey[key]).filter(Boolean);
        setRooms(ordered);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rooms, loading };
}
