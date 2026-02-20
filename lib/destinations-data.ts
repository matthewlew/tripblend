export interface DestinationData {
  id: string;
  name: string;
  country: string;
  region: string;
  type: "city" | "country" | "region";
  bestMonths: number[];
  shoulderMonths: number[];
  tags: string[];
  avgCostLevel: 1 | 2 | 3 | 4 | 5; // 1 = budget, 5 = expensive
  visaFreeFor: string[]; // List of passport countries with visa-free access
}

export const ALL_DESTINATIONS: DestinationData[] = [
  // Asia
  { id: "bali", name: "Bali", country: "Indonesia", region: "Asia", type: "region", bestMonths: [4, 5, 6, 7, 8, 9], shoulderMonths: [3, 10], tags: ["beach", "culture", "wellness", "surfing"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "tokyo", name: "Tokyo", country: "Japan", region: "Asia", type: "city", bestMonths: [3, 4, 10, 11], shoulderMonths: [5, 9], tags: ["city", "culture", "food", "technology"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "kyoto", name: "Kyoto", country: "Japan", region: "Asia", type: "city", bestMonths: [3, 4, 10, 11], shoulderMonths: [5, 9], tags: ["culture", "temples", "gardens", "history"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "bangkok", name: "Bangkok", country: "Thailand", region: "Asia", type: "city", bestMonths: [11, 12, 1, 2], shoulderMonths: [3, 10], tags: ["city", "food", "temples", "nightlife"], avgCostLevel: 1, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "phuket", name: "Phuket", country: "Thailand", region: "Asia", type: "region", bestMonths: [11, 12, 1, 2, 3], shoulderMonths: [4, 10], tags: ["beach", "islands", "diving", "nightlife"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "vietnam", name: "Vietnam", country: "Vietnam", region: "Asia", type: "country", bestMonths: [2, 3, 4, 10, 11], shoulderMonths: [1, 5, 9, 12], tags: ["culture", "food", "history", "nature"], avgCostLevel: 1, visaFreeFor: ["UK", "EU"] },
  { id: "singapore", name: "Singapore", country: "Singapore", region: "Asia", type: "city", bestMonths: [2, 3, 4, 5, 6, 7, 8, 9], shoulderMonths: [1, 10, 11, 12], tags: ["city", "food", "modern", "shopping"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "seoul", name: "Seoul", country: "South Korea", region: "Asia", type: "city", bestMonths: [4, 5, 9, 10], shoulderMonths: [3, 6, 11], tags: ["city", "food", "culture", "kpop"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "maldives", name: "Maldives", country: "Maldives", region: "Asia", type: "country", bestMonths: [1, 2, 3, 4], shoulderMonths: [11, 12], tags: ["beach", "luxury", "diving", "honeymoon"], avgCostLevel: 5, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "sri-lanka", name: "Sri Lanka", country: "Sri Lanka", region: "Asia", type: "country", bestMonths: [1, 2, 3, 4, 12], shoulderMonths: [5, 11], tags: ["beach", "culture", "wildlife", "temples"], avgCostLevel: 2, visaFreeFor: [] },
  
  // Europe
  { id: "paris", name: "Paris", country: "France", region: "Europe", type: "city", bestMonths: [4, 5, 6, 9, 10], shoulderMonths: [3, 7, 11], tags: ["city", "culture", "food", "romance"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "barcelona", name: "Barcelona", country: "Spain", region: "Europe", type: "city", bestMonths: [5, 6, 9, 10], shoulderMonths: [4, 11], tags: ["city", "beach", "culture", "architecture"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "rome", name: "Rome", country: "Italy", region: "Europe", type: "city", bestMonths: [4, 5, 9, 10], shoulderMonths: [3, 6, 11], tags: ["city", "history", "food", "culture"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "amalfi", name: "Amalfi Coast", country: "Italy", region: "Europe", type: "region", bestMonths: [5, 6, 9, 10], shoulderMonths: [4, 7], tags: ["beach", "coastal", "food", "romantic"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "amsterdam", name: "Amsterdam", country: "Netherlands", region: "Europe", type: "city", bestMonths: [4, 5, 6, 7, 8, 9], shoulderMonths: [3, 10], tags: ["city", "culture", "cycling", "canals"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "london", name: "London", country: "UK", region: "Europe", type: "city", bestMonths: [5, 6, 7, 8, 9], shoulderMonths: [4, 10], tags: ["city", "culture", "history", "theatre"], avgCostLevel: 5, visaFreeFor: ["US", "EU", "CA", "AU"] },
  { id: "lisbon", name: "Lisbon", country: "Portugal", region: "Europe", type: "city", bestMonths: [4, 5, 6, 9, 10], shoulderMonths: [3, 7, 11], tags: ["city", "beach", "food", "nightlife"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "iceland", name: "Iceland", country: "Iceland", region: "Europe", type: "country", bestMonths: [6, 7, 8], shoulderMonths: [5, 9], tags: ["nature", "adventure", "northern-lights", "unique"], avgCostLevel: 5, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "santorini", name: "Santorini", country: "Greece", region: "Europe", type: "region", bestMonths: [5, 6, 9, 10], shoulderMonths: [4, 7, 11], tags: ["beach", "romantic", "islands", "views"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "swiss-alps", name: "Swiss Alps", country: "Switzerland", region: "Europe", type: "region", bestMonths: [6, 7, 8, 12, 1, 2], shoulderMonths: [5, 9, 3], tags: ["mountains", "skiing", "hiking", "scenic"], avgCostLevel: 5, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "croatia", name: "Croatia", country: "Croatia", region: "Europe", type: "country", bestMonths: [5, 6, 9], shoulderMonths: [4, 7, 10], tags: ["beach", "islands", "history", "game-of-thrones"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "CA", "AU"] },
  { id: "prague", name: "Prague", country: "Czech Republic", region: "Europe", type: "city", bestMonths: [4, 5, 9, 10], shoulderMonths: [3, 6, 11], tags: ["city", "history", "beer", "architecture"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "CA", "AU"] },
  
  // Americas
  { id: "new-york", name: "New York City", country: "USA", region: "Americas", type: "city", bestMonths: [4, 5, 6, 9, 10, 11], shoulderMonths: [3, 12], tags: ["city", "culture", "food", "entertainment"], avgCostLevel: 5, visaFreeFor: ["UK", "EU", "CA", "AU"] },
  { id: "los-angeles", name: "Los Angeles", country: "USA", region: "Americas", type: "city", bestMonths: [3, 4, 5, 9, 10, 11], shoulderMonths: [6, 12], tags: ["city", "beach", "entertainment", "hiking"], avgCostLevel: 4, visaFreeFor: ["UK", "EU", "CA", "AU"] },
  { id: "miami", name: "Miami", country: "USA", region: "Americas", type: "city", bestMonths: [11, 12, 1, 2, 3, 4], shoulderMonths: [5, 10], tags: ["beach", "nightlife", "art-deco", "latin"], avgCostLevel: 4, visaFreeFor: ["UK", "EU", "CA", "AU"] },
  { id: "hawaii", name: "Hawaii", country: "USA", region: "Americas", type: "region", bestMonths: [4, 5, 6, 9, 10], shoulderMonths: [3, 11], tags: ["beach", "nature", "islands", "surfing"], avgCostLevel: 4, visaFreeFor: ["UK", "EU", "CA", "AU"] },
  { id: "costa-rica", name: "Costa Rica", country: "Costa Rica", region: "Americas", type: "country", bestMonths: [12, 1, 2, 3, 4], shoulderMonths: [11], tags: ["nature", "adventure", "wildlife", "beach"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "mexico-city", name: "Mexico City", country: "Mexico", region: "Americas", type: "city", bestMonths: [3, 4, 5, 10, 11], shoulderMonths: [2, 12], tags: ["city", "food", "culture", "history"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "cancun", name: "Cancun", country: "Mexico", region: "Americas", type: "city", bestMonths: [12, 1, 2, 3, 4], shoulderMonths: [5, 11], tags: ["beach", "resort", "nightlife", "ruins"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "peru", name: "Peru", country: "Peru", region: "Americas", type: "country", bestMonths: [5, 6, 7, 8, 9], shoulderMonths: [4, 10], tags: ["adventure", "culture", "history", "nature"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "argentina", name: "Argentina", country: "Argentina", region: "Americas", type: "country", bestMonths: [10, 11, 12, 1, 2, 3], shoulderMonths: [4, 9], tags: ["wine", "culture", "nature", "tango"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "colombia", name: "Colombia", country: "Colombia", region: "Americas", type: "country", bestMonths: [12, 1, 2, 3, 7, 8], shoulderMonths: [4, 6, 11], tags: ["city", "nature", "culture", "coffee"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  
  // Oceania
  { id: "new-zealand", name: "New Zealand", country: "New Zealand", region: "Oceania", type: "country", bestMonths: [12, 1, 2, 3], shoulderMonths: [11, 4], tags: ["adventure", "nature", "hiking", "scenic"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA"] },
  { id: "sydney", name: "Sydney", country: "Australia", region: "Oceania", type: "city", bestMonths: [10, 11, 12, 1, 2, 3], shoulderMonths: [4, 9], tags: ["city", "beach", "culture", "nature"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA"] },
  { id: "great-barrier-reef", name: "Great Barrier Reef", country: "Australia", region: "Oceania", type: "region", bestMonths: [6, 7, 8, 9, 10], shoulderMonths: [5, 11], tags: ["diving", "nature", "beach", "marine"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA"] },
  { id: "fiji", name: "Fiji", country: "Fiji", region: "Oceania", type: "country", bestMonths: [5, 6, 7, 8, 9, 10], shoulderMonths: [4, 11], tags: ["beach", "islands", "diving", "honeymoon"], avgCostLevel: 3, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  
  // Africa & Middle East
  { id: "morocco", name: "Morocco", country: "Morocco", region: "Africa", type: "country", bestMonths: [3, 4, 5, 9, 10, 11], shoulderMonths: [2, 6, 12], tags: ["culture", "history", "food", "desert"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "south-africa", name: "South Africa", country: "South Africa", region: "Africa", type: "country", bestMonths: [5, 6, 7, 8, 9, 10], shoulderMonths: [4, 11], tags: ["wildlife", "nature", "wine", "adventure"], avgCostLevel: 2, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "dubai", name: "Dubai", country: "UAE", region: "Middle East", type: "city", bestMonths: [11, 12, 1, 2, 3], shoulderMonths: [4, 10], tags: ["city", "luxury", "shopping", "modern"], avgCostLevel: 4, visaFreeFor: ["US", "UK", "EU", "CA", "AU"] },
  { id: "egypt", name: "Egypt", country: "Egypt", region: "Africa", type: "country", bestMonths: [10, 11, 12, 1, 2, 3], shoulderMonths: [4, 9], tags: ["history", "culture", "pyramids", "desert"], avgCostLevel: 2, visaFreeFor: [] },
  { id: "tanzania", name: "Tanzania", country: "Tanzania", region: "Africa", type: "country", bestMonths: [6, 7, 8, 9, 10, 1, 2], shoulderMonths: [3, 11, 12], tags: ["wildlife", "safari", "nature", "mountains"], avgCostLevel: 3, visaFreeFor: [] },
];

export const REGIONS = ["Asia", "Europe", "Americas", "Oceania", "Africa", "Middle East"];

export const TAGS = [
  "beach", "city", "nature", "culture", "food", "adventure", "luxury", 
  "mountains", "islands", "history", "wildlife", "diving", "skiing",
  "nightlife", "romantic", "hiking", "surfing", "temples", "shopping"
];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const MONTH_ABBREV = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Helper to get season info for a destination in a given month
export function getSeasonInfo(dest: DestinationData, month: number): "best" | "shoulder" | "off" {
  if (dest.bestMonths.includes(month)) return "best";
  if (dest.shoulderMonths.includes(month)) return "shoulder";
  return "off";
}

// Search destinations
export function searchDestinations(query: string): DestinationData[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  
  return ALL_DESTINATIONS.filter(dest => 
    dest.name.toLowerCase().includes(q) ||
    dest.country.toLowerCase().includes(q) ||
    dest.region.toLowerCase().includes(q) ||
    dest.tags.some(tag => tag.toLowerCase().includes(q))
  ).slice(0, 10);
}
