import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { rooms } from "../data/roomsGallery";
import "./RoomsGallery.css";

export default function RoomsGallery() {
  const { t } = useLanguage();

  return (
    <div className="rooms-gallery">
      {rooms.map((room) => (
        <section key={room.key} className="room-block">
          <h3 className="room-title">{t.amenities.rooms[room.key]}</h3>

          <div className="room-images">
            {room.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={t.amenities.rooms[room.key]}
                className="room-image"
                loading="lazy"
              />
            ))}
          </div>

          {room.amenityKeys.length > 0 && (
            <ul className="room-amenities">
              {room.amenityKeys.map((key) => (
                <li key={key}>{t.amenities.labels[key]}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
