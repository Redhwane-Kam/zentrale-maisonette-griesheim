import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { amenitiesCategories } from "../i18n/amenitiesData";
import "./AmenitiesList.css";

export default function AmenitiesList() {
  const { t } = useLanguage();

  return (
    <div className="amenities-list">
      {amenitiesCategories.map((category) => (
        <div key={category.key} className="amenities-category">
          <h3>{t.amenities.categories[category.key]}</h3>
          <ul>
            {category.items.map((itemKey) => (
              <li key={itemKey}>{t.amenities.labels[itemKey]}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
