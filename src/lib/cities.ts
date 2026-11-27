import type { IndianCity } from "./types";

export const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 37.6,
  minLon: 68.0,
  maxLon: 97.5,
} as const;

export const MAJOR_INDIAN_CITIES: IndianCity[] = [
  { id: "delhi", name: "Delhi", nameHi: "दिल्ली", state: "Delhi", lat: 28.6139, lon: 77.209 },
  { id: "mumbai", name: "Mumbai", nameHi: "मुंबई", state: "Maharashtra", lat: 19.076, lon: 72.8777 },
  { id: "kolkata", name: "Kolkata", nameHi: "कोलकाता", state: "West Bengal", lat: 22.5726, lon: 88.3639 },
  { id: "chennai", name: "Chennai", nameHi: "चेन्नई", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707 },
  { id: "bengaluru", name: "Bengaluru", nameHi: "बेंगलुरु", state: "Karnataka", lat: 12.9716, lon: 77.5946 },
  { id: "hyderabad", name: "Hyderabad", nameHi: "हैदराबाद", state: "Telangana", lat: 17.385, lon: 78.4867 },
  { id: "bhopal", name: "Bhopal", nameHi: "भोपाल", state: "Madhya Pradesh", lat: 23.2599, lon: 77.4126 },
  { id: "indore", name: "Indore", nameHi: "इंदौर", state: "Madhya Pradesh", lat: 22.7196, lon: 75.8577 },
  { id: "raipur", name: "Raipur", nameHi: "रायपुर", state: "Chhattisgarh", lat: 21.2514, lon: 81.6296 },
  { id: "lucknow", name: "Lucknow", nameHi: "लखनऊ", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  { id: "patna", name: "Patna", nameHi: "पटना", state: "Bihar", lat: 25.5941, lon: 85.1376 },
  { id: "jaipur", name: "Jaipur", nameHi: "जयपुर", state: "Rajasthan", lat: 26.9124, lon: 75.7873 },
  { id: "ahmedabad", name: "Ahmedabad", nameHi: "अहमदाबाद", state: "Gujarat", lat: 23.0225, lon: 72.5714 },
  { id: "pune", name: "Pune", nameHi: "पुणे", state: "Maharashtra", lat: 18.5204, lon: 73.8567 },
  { id: "chandigarh", name: "Chandigarh", nameHi: "चंडीगढ़", state: "Chandigarh", lat: 30.7333, lon: 76.7794 },
  { id: "ranchi", name: "Ranchi", nameHi: "रांची", state: "Jharkhand", lat: 23.3441, lon: 85.3096 },
  { id: "nagpur", name: "Nagpur", nameHi: "नागपुर", state: "Maharashtra", lat: 21.1458, lon: 79.0882 },
  { id: "varanasi", name: "Varanasi", nameHi: "वाराणसी", state: "Uttar Pradesh", lat: 25.3176, lon: 82.9739 },
  { id: "kanpur", name: "Kanpur", nameHi: "कानपुर", state: "Uttar Pradesh", lat: 26.4499, lon: 80.3319 },
  { id: "guwahati", name: "Guwahati", nameHi: "गुवाहाटी", state: "Assam", lat: 26.1445, lon: 91.7362 },
  { id: "bhubaneswar", name: "Bhubaneswar", nameHi: "भुवनेश्वर", state: "Odisha", lat: 20.2961, lon: 85.8245 },
  { id: "dehradun", name: "Dehradun", nameHi: "देहरादून", state: "Uttarakhand", lat: 30.3165, lon: 78.0322 },
  { id: "srinagar", name: "Srinagar", nameHi: "श्रीनगर", state: "Jammu & Kashmir", lat: 34.0837, lon: 74.7973 },
  { id: "kochi", name: "Kochi", nameHi: "कोच्चि", state: "Kerala", lat: 9.9312, lon: 76.2673 },
  { id: "visakhapatnam", name: "Visakhapatnam", nameHi: "विशाखापत्तनम", state: "Andhra Pradesh", lat: 17.6868, lon: 83.2185 },
  { id: "surat", name: "Surat", nameHi: "सूरत", state: "Gujarat", lat: 21.1702, lon: 72.8311 },
  { id: "amritsar", name: "Amritsar", nameHi: "अमृतसर", state: "Punjab", lat: 31.634, lon: 74.8723 },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram", nameHi: "तिरुवनंतपुरम", state: "Kerala", lat: 8.5241, lon: 76.9366 },
];

export function isWithinIndiaBounds(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestIndianCity(lat: number, lon: number): IndianCity {
  let nearest = MAJOR_INDIAN_CITIES[0];
  let bestDist = Infinity;
  for (const city of MAJOR_INDIAN_CITIES) {
    const dist = haversineKm(lat, lon, city.lat, city.lon);
    if (dist < bestDist) {
      bestDist = dist;
      nearest = city;
    }
  }
  return nearest;
}
