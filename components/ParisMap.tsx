"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Coordonnées approximatives des arrondissements de Paris (centres)
const parisArrondissements = [
  {
    id: 1,
    name: "1",
    center: [48.8606, 2.3376],
    alertes: 5,
    suggestions: 12,
  },
  {
    id: 2,
    name: "2",
    center: [48.8698, 2.3412],
    alertes: 3,
    suggestions: 8,
  },
  {
    id: 3,
    name: "3",
    center: [48.8630, 2.3624],
    alertes: 8,
    suggestions: 15,
  },
  {
    id: 4,
    name: "4",
    center: [48.8534, 2.3488],
    alertes: 12,
    suggestions: 20,
  },
  {
    id: 5,
    name: "5",
    center: [48.8448, 2.3447],
    alertes: 6,
    suggestions: 18,
  },
  {
    id: 6,
    name: "6",
    center: [48.8442, 2.3330],
    alertes: 4,
    suggestions: 22,
  },
  {
    id: 7,
    name: "7",
    center: [48.8565, 2.3147],
    alertes: 7,
    suggestions: 16,
  },
  {
    id: 8,
    name: "8",
    center: [48.8756, 2.3132],
    alertes: 9,
    suggestions: 14,
  },
  {
    id: 9,
    name: "9",
    center: [48.8742, 2.3397],
    alertes: 11,
    suggestions: 19,
  },
  {
    id: 10,
    name: "10",
    center: [48.8756, 2.3624],
    alertes: 15,
    suggestions: 10,
  },
  {
    id: 11,
    name: "11",
    center: [48.8612, 2.3792],
    alertes: 18,
    suggestions: 12,
  },
  {
    id: 12,
    name: "12",
    center: [48.8448, 2.3700],
    alertes: 10,
    suggestions: 17,
  },
];

// Fonction pour calculer la couleur selon la tendance dominante
// Utilise les couleurs officielles du DSFR
function getColorForZone(alertes: number, suggestions: number): string {
  const total = alertes + suggestions;
  if (total === 0) return "#cccccc";
  
  const ratio = suggestions / total;
  
  // Plus de suggestions = plus bleu, plus d'alertes = plus rouge
  // Couleurs officielles DSFR :
  // - Bleu France : #0063cb (blue-france-sun-113-625)
  // - Rouge Marianne : #e1000f (error-425-625)
  if (ratio >= 0.6) {
    // Dominance de suggestions (bleu France DSFR)
    const intensity = Math.min(1, total / 30);
    const opacity = 0.3 + intensity * 0.5;
    return `rgba(0, 99, 203, ${opacity})`; // #0063cb en rgba
  } else if (ratio <= 0.4) {
    // Dominance d'alertes (rouge Marianne DSFR)
    const intensity = Math.min(1, total / 30);
    const opacity = 0.3 + intensity * 0.5;
    return `rgba(225, 0, 15, ${opacity})`; // #e1000f en rgba
  } else {
    // Mixte (violet/mauve)
    return `rgba(128, 50, 109, 0.4)`;
  }
}

export function ParisMap() {
  return (
    <MapContainer
      center={[48.8566, 2.3522]}
      zoom={12}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {parisArrondissements.map((arr) => {
        const color = getColorForZone(arr.alertes, arr.suggestions);
        const radius = Math.sqrt(arr.alertes + arr.suggestions) * 150;
        
        // Créer un polygone circulaire approximatif
        const points: [number, number][] = [];
        const numPoints = 32;
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * 2 * Math.PI;
          const lat = arr.center[0] + (radius / 111000) * Math.cos(angle);
          const lng = arr.center[1] + (radius / (111000 * Math.cos(arr.center[0] * Math.PI / 180))) * Math.sin(angle);
          points.push([lat, lng]);
        }
        
        return (
          <Polygon
            key={arr.id}
            positions={points}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.6,
              color: "#ffffff",
              weight: 2,
            }}
          />
        );
      })}
    </MapContainer>
  );
}

