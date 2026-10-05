import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { amenitiesCategories } from "../i18n/amenitiesData";
import fr from "../i18n/fr";
import "./RoomEditor.css";

// Liste des pièces, dans l'ordre d'affichage souhaité au back-office.
const ROOM_KEYS = [
  "salon",
  "suiteParentale",
  "chambreEnfants",
  "cuisine",
  "secondeSdb",
  "entree",
  "facade",
  "parking"
];

export default function RoomEditor() {
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(ROOM_KEYS[0]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("room_content").select("*");
    if (error) {
      console.error(error);
    } else {
      const byKey = {};
      (data || []).forEach((r) => {
        byKey[r.room_key] = r;
      });
      setRooms(byKey);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const current = rooms[selectedRoom];

  function toggleAmenity(key) {
    if (!current) return;
    const has = current.amenity_keys.includes(key);
    const updated = has
      ? current.amenity_keys.filter((k) => k !== key)
      : [...current.amenity_keys, key];
    setRooms({ ...rooms, [selectedRoom]: { ...current, amenity_keys: updated } });
  }

  function updateComment(lang, value) {
    if (!current) return;
    setRooms({ ...rooms, [selectedRoom]: { ...current, [`comment_${lang}`]: value } });
  }

  async function saveRoom() {
    if (!current) return;
    setSaving(true);
    const { error } = await supabase
      .from("room_content")
      .update({
        amenity_keys: current.amenity_keys,
        comment_fr: current.comment_fr,
        comment_en: current.comment_en,
        comment_de: current.comment_de,
        photos: current.photos,
        updated_at: new Date().toISOString()
      })
      .eq("room_key", selectedRoom);

    setSaving(false);
    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      alert("Modifications enregistrées.");
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file || !current) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${selectedRoom}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("room-photos")
      .upload(fileName, file);

    if (uploadError) {
      alert("Erreur lors de l'upload : " + uploadError.message);
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("room-photos")
      .getPublicUrl(fileName);

    const updatedPhotos = [...current.photos, publicUrlData.publicUrl];
    setRooms({ ...rooms, [selectedRoom]: { ...current, photos: updatedPhotos } });
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(index) {
    if (!current) return;
    if (!window.confirm("Supprimer cette photo ?")) return;
    const updatedPhotos = current.photos.filter((_, i) => i !== index);
    setRooms({ ...rooms, [selectedRoom]: { ...current, photos: updatedPhotos } });
  }

  function movePhoto(index, direction) {
    if (!current) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= current.photos.length) return;
    const updated = [...current.photos];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setRooms({ ...rooms, [selectedRoom]: { ...current, photos: updated } });
  }

  if (loading) return <p className="admin-loading">Chargement...</p>;

  return (
    <div className="room-editor">
      <div className="room-editor-tabs">
        {ROOM_KEYS.map((key) => (
          <button
            key={key}
            className={`room-editor-tab ${selectedRoom === key ? "active" : ""}`}
            onClick={() => setSelectedRoom(key)}
          >
            {fr.amenities.rooms[key]}
          </button>
        ))}
      </div>

      {current && (
        <div className="room-editor-content">
          <section className="room-editor-section">
            <h3>Photos</h3>
            <div className="room-editor-photos">
              {current.photos.map((url, i) => (
                <div key={url + i} className="room-editor-photo">
                  <img src={url} alt={`${fr.amenities.rooms[selectedRoom]} ${i + 1}`} />
                  <div className="room-editor-photo-actions">
                    <button onClick={() => movePhoto(i, -1)} disabled={i === 0} title="Monter">↑</button>
                    <button onClick={() => movePhoto(i, 1)} disabled={i === current.photos.length - 1} title="Descendre">↓</button>
                    <button onClick={() => removePhoto(i)} title="Supprimer" className="room-editor-photo-remove">✕</button>
                  </div>
                </div>
              ))}
            </div>
            <label className="room-editor-upload-btn">
              {uploading ? "Envoi en cours..." : "+ Ajouter une photo"}
              <input type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} hidden />
            </label>
          </section>

          <section className="room-editor-section">
            <h3>Équipements</h3>
            {amenitiesCategories.map((category) => (
              <div key={category.key} className="room-editor-category">
                <h4>{fr.amenities.categories[category.key]}</h4>
                <div className="room-editor-checkboxes">
                  {category.items.map((itemKey) => (
                    <label key={itemKey} className="room-editor-checkbox">
                      <input
                        type="checkbox"
                        checked={current.amenity_keys.includes(itemKey)}
                        onChange={() => toggleAmenity(itemKey)}
                      />
                      {fr.amenities.labels[itemKey]}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="room-editor-section">
            <h3>Commentaire (3 langues)</h3>
            <label className="room-editor-comment-label">
              Français
              <textarea
                value={current.comment_fr}
                onChange={(e) => updateComment("fr", e.target.value)}
                rows={3}
              />
            </label>
            <label className="room-editor-comment-label">
              Anglais
              <textarea
                value={current.comment_en}
                onChange={(e) => updateComment("en", e.target.value)}
                rows={3}
              />
            </label>
            <label className="room-editor-comment-label">
              Allemand
              <textarea
                value={current.comment_de}
                onChange={(e) => updateComment("de", e.target.value)}
                rows={3}
              />
            </label>
          </section>

          <button className="room-editor-save-btn" onClick={saveRoom} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      )}
    </div>
  );
}
