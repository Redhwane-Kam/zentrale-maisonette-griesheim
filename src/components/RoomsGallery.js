import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useRoomContent } from "../data/useRoomContent";
import "./RoomsGallery.css";

export default function RoomsGallery() {
  const { t, lang } = useLanguage();
  const { rooms, loading } = useRoomContent();

  if (loading) return null;

  return (
    <div className="rooms-gallery">
      {rooms.map((room) => {
        const comment = room[`comment_${lang}`];

        return (
          <section key={room.room_key} className="room-block">
            <h3 className="room-title">{t.amenities.rooms[room.room_key]}</h3>

            <div className="room-images">
              {room.photos.map((src, i) => (
                <img
                  key={src + i}
                  src={src}
                  alt={t.amenities.rooms[room.room_key]}
                  className="room-image"
                  loading="lazy"
                />
              ))}
            </div>

            {room.amenity_keys.length > 0 && (
              <ul className="room-amenities">
                {room.amenity_keys.map((key) => (
                  <li key={key}>{t.amenities.labels[key]}</li>
                ))}
              </ul>
            )}

            {comment && <p className="room-comment">{comment}</p>}
          </section>
        );
      })}
    </div>
  );
}
