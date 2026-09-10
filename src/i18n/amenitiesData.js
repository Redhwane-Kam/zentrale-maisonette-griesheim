// src/i18n/amenitiesData.js
// Structure commune (catégories + clés) — le texte traduit vit dans fr.js/de.js/en.js
// via amenitiesLabels[lang][clé]. Garder cette structure synchronisée avec les 3 fichiers.

export const amenitiesCategories = [
  {
    key: "general",
    items: [
      "wifi", "parking", "elevator", "privateEntrance", "livingRoom",
      "kitchenFull", "workspace", "tv", "heating", "longStay"
    ]
  },
  {
    key: "kitchen",
    items: [
      "fridge", "freezer", "oven", "hob", "microwave", "dishwasher",
      "miniFridge", "dishesUtensils", "potsPans", "basics", "diningTable",
      "coffeeMaker", "coffee", "kettle", "toaster", "blender", "bakingSheet", "foodStorage"
    ]
  },
  {
    key: "comfort",
    items: [
      "linens", "extraBedding", "blackoutCurtains", "fans", "wardrobe",
      "hangers", "iron", "dryingRack", "books", "bluetooth", "ethernet"
    ]
  },
  {
    key: "bathroom",
    items: ["twoBathrooms", "hotWater", "hairDryer", "shampoo", "soap", "bidet"]
  },
  {
    key: "safety",
    items: ["smokeDetector", "coDetector", "fireExtinguisher", "firstAid", "cleaningProducts"]
  },
  {
    key: "parkingExtra",
    items: ["streetParking", "paidParkingNearby"]
  }
];
