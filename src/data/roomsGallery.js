// src/data/roomsGallery.js
// Organisation des photos du logement par pièce, avec les équipements associés.
// Les fichiers image doivent être déposés dans /public/images/ avec les noms
// exacts indiqués ci-dessous (ex: /public/images/salon-1.jpg).

export const heroImage = "/images/salon-1.jpg"; // photo principale (secours, si diaporama non chargé)

// Toutes les photos, pour le diaporama tactile de la page d'accueil.
// L'ordre reprend celui indiqué par la fille.
export const heroCarouselImages = [
  "/images/salon-1.jpg",
  "/images/chambre-enfants-1.jpg",
  "/images/parking-1.jpg",
  "/images/parking-2.jpg",
  "/images/parking-panneau.jpg",
  "/images/entree-immeuble.jpg",
  "/images/facade-immeuble.jpg",
  "/images/suite-parentale-sdb-1.jpg",
  "/images/suite-parentale-sdb-2.jpg",
  "/images/suite-parentale-chambre-1.jpg",
  "/images/suite-parentale-chambre-2.jpg",
  "/images/cuisine-1.jpg",
  "/images/cuisine-2.jpg",
  "/images/cuisine-3.jpg",
  "/images/salon-2.jpg",
  "/images/salon-3.jpg",
  "/images/chambre-enfants-2.jpg",
  "/images/seconde-sdb-1.jpg",
  "/images/seconde-sdb-2.jpg"
];

export const rooms = [
  {
    key: "salon",
    images: ["/images/salon-1.jpg", "/images/salon-2.jpg", "/images/salon-3.jpg"],
    amenityKeys: [
      "livingRoom", "tv", "bluetooth", "heating", "wifi",
      "blackoutCurtains", "fans", "books", "ethernet"
    ]
  },
  {
    key: "suiteParentale",
    images: [
      "/images/suite-parentale-chambre-1.jpg",
      "/images/suite-parentale-chambre-2.jpg",
      "/images/suite-parentale-sdb-1.jpg",
      "/images/suite-parentale-sdb-2.jpg"
    ],
    amenityKeys: [
      "linens", "extraBedding", "wardrobe", "hangers",
      "hotWater", "hairDryer", "shampoo", "soap"
    ]
  },
  {
    key: "chambreEnfants",
    images: ["/images/chambre-enfants-1.jpg", "/images/chambre-enfants-2.jpg"],
    amenityKeys: ["linens", "extraBedding", "workspace", "wardrobe"]
  },
  {
    key: "cuisine",
    images: ["/images/cuisine-1.jpg", "/images/cuisine-2.jpg", "/images/cuisine-3.jpg"],
    amenityKeys: [
      "kitchenFull", "fridge", "freezer", "oven", "hob", "microwave",
      "dishwasher", "miniFridge", "dishesUtensils", "potsPans", "basics",
      "diningTable", "coffeeMaker", "coffee", "kettle", "toaster",
      "blender", "bakingSheet", "foodStorage"
    ]
  },
  {
    key: "secondeSdb",
    images: ["/images/seconde-sdb-1.jpg", "/images/seconde-sdb-2.jpg"],
    amenityKeys: ["twoBathrooms", "hotWater", "bidet", "cleaningProducts"]
  },
  {
    key: "entree",
    images: ["/images/entree-immeuble.jpg"],
    amenityKeys: ["privateEntrance", "elevator"]
  },
  {
    key: "facade",
    images: ["/images/facade-immeuble.jpg"],
    amenityKeys: []
  },
  {
    key: "parking",
    images: ["/images/parking-1.jpg", "/images/parking-2.jpg", "/images/parking-panneau.jpg"],
    amenityKeys: ["paidParkingNearby", "streetParking"]
  }
];
