import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the CSV file
const csvPath = path.join(__dirname, '../user_read_only_context/text_attachments/world_destinations_final_deduplicated-AcdfX.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV
const lines = csvContent.trim().split('\n');
const header = lines[0];
const dataLines = lines.slice(1);

// Helper to parse month strings to arrays
function parseMonths(monthStr) {
  if (!monthStr || monthStr === '""' || monthStr === '') return [];
  const cleaned = monthStr.replace(/"/g, '').trim();
  if (!cleaned) return [];
  return cleaned.split(',').map(m => parseInt(m.trim())).filter(m => !isNaN(m));
}

// Helper to map countries to regions
function getRegion(country) {
  const regionMap = {
    "United States": "North America", "Canada": "North America", "Mexico": "North America",
    "Cuba": "Caribbean", "Jamaica": "Caribbean", "Bahamas": "Caribbean", "Barbados": "Caribbean",
    "Aruba": "Caribbean", "Puerto Rico": "Caribbean", "Dominican Republic": "Caribbean",
    "Costa Rica": "Central America", "Panama": "Central America", "Belize": "Central America",
    "Guatemala": "Central America", "Colombia": "South America", "Ecuador": "South America",
    "Peru": "South America", "Bolivia": "South America", "Chile": "South America",
    "Argentina": "South America", "Brazil": "South America", "Uruguay": "South America",
    "Paraguay": "South America", "Venezuela": "South America",
    "United Kingdom": "Europe", "Ireland": "Europe", "France": "Europe", "Germany": "Europe",
    "Italy": "Europe", "Spain": "Europe", "Portugal": "Europe", "Netherlands": "Europe",
    "Belgium": "Europe", "Switzerland": "Europe", "Austria": "Europe", "Denmark": "Europe",
    "Sweden": "Europe", "Norway": "Europe", "Finland": "Europe", "Iceland": "Europe",
    "Poland": "Europe", "Czech Republic": "Europe", "Hungary": "Europe", "Croatia": "Europe",
    "Greece": "Europe", "Turkey": "Europe", "Estonia": "Europe", "Latvia": "Europe",
    "Lithuania": "Europe", "Slovenia": "Europe", "Slovakia": "Europe", "Bulgaria": "Europe",
    "Romania": "Europe", "Serbia": "Europe", "Bosnia and Herzegovina": "Europe",
    "North Macedonia": "Europe", "Albania": "Europe", "Montenegro": "Europe",
    "Kosovo": "Europe", "Moldova": "Europe", "Ukraine": "Europe", "Russia": "Europe",
    "Georgia": "Asia", "Armenia": "Asia", "Azerbaijan": "Asia",
    "Japan": "Asia", "China": "Asia", "Taiwan": "Asia", "South Korea": "Asia",
    "Thailand": "Asia", "Vietnam": "Asia", "Singapore": "Asia", "Malaysia": "Asia",
    "Indonesia": "Asia", "Philippines": "Asia", "India": "Asia", "Nepal": "Asia",
    "Sri Lanka": "Asia", "Maldives": "Asia", "Kazakhstan": "Asia", "Uzbekistan": "Asia",
    "Kyrgyzstan": "Asia", "Cambodia": "Asia", "Laos": "Asia", "Myanmar": "Asia",
    "Bangladesh": "Asia", "Pakistan": "Asia", "Afghanistan": "Asia", "Mongolia": "Asia",
    "United Arab Emirates": "Middle East", "Qatar": "Middle East", "Oman": "Middle East",
    "Saudi Arabia": "Middle East", "Kuwait": "Middle East", "Bahrain": "Middle East",
    "Israel": "Middle East", "Jordan": "Middle East", "Lebanon": "Middle East",
    "Iraq": "Middle East", "Iran": "Middle East", "Yemen": "Middle East",
    "Egypt": "Africa", "Morocco": "Africa", "South Africa": "Africa", "Kenya": "Africa",
    "Tanzania": "Africa", "Rwanda": "Africa", "Ethiopia": "Africa", "Ghana": "Africa",
    "Nigeria": "Africa", "Senegal": "Africa", "Tunisia": "Africa", "Algeria": "Africa",
    "Namibia": "Africa", "Zimbabwe": "Africa", "Botswana": "Africa", "Mozambique": "Africa",
    "Madagascar": "Africa", "Ivory Coast": "Africa", "Gambia": "Africa", "Mali": "Africa",
    "Burkina Faso": "Africa", "Niger": "Africa", "Mauritania": "Africa", "Togo": "Africa",
    "Uganda": "Africa", "Burundi": "Africa", "Seychelles": "Africa", "Mauritius": "Africa",
    "Reunion": "Africa",
    "Australia": "Oceania", "New Zealand": "Oceania", "Fiji": "Oceania",
    "Papua New Guinea": "Oceania", "French Polynesia": "Oceania", "Samoa": "Oceania",
    "Solomon Islands": "Oceania", "Palau": "Oceania"
  };
  return regionMap[country] || "Other";
}

// Parse each city
const cities = [];
const seen = new Set();

for (const line of dataLines) {
  // Parse CSV line (handle quoted fields)
  const match = line.match(/^([^,]+),([^,]+),([^,]+),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*)$/);
  if (!match) {
    console.warn('Failed to parse line:', line);
    continue;
  }

  const [, destination, country, cityIata, highSeason, shoulderSeason] = match;
  
  // Create unique ID
  const id = destination.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Skip duplicates
  if (seen.has(id)) {
    console.warn(`Duplicate destination skipped: ${destination}`);
    continue;
  }
  seen.add(id);
  
  const bestMonths = parseMonths(highSeason);
  const shoulderMonths = parseMonths(shoulderSeason);
  
  cities.push({
    id,
    name: destination,
    country,
    region: getRegion(country),
    airportCode: cityIata || undefined,
    type: 'city',
    bestMonths: bestMonths.length > 0 ? bestMonths : undefined,
    shoulderMonths: shoulderMonths.length > 0 ? shoulderMonths : undefined
  });
}

console.log(`Parsed ${cities.length} cities`);

// Generate TypeScript code
const tsCode = `// World destinations database with ${cities.length} cities
export interface CityData {
  id: string;
  name: string;
  country: string;
  region: string;
  airportCode?: string;
  nearestAirports?: Array<{
    code: string;
    name: string;
    distance?: string;
  }>;
  type: "city";
  bestMonths?: number[];
  shoulderMonths?: number[];
  trending2026?: boolean;
}

export const citiesData: CityData[] = ${JSON.stringify(cities, null, 2)};

// Helper function to search cities
export function searchCities(query: string, limit: number = 10): CityData[] {
  const q = query.toLowerCase();
  return citiesData
    .filter(city => 
      city.name.toLowerCase().includes(q) ||
      city.country.toLowerCase().includes(q) ||
      city.region.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

// Helper function to get city by ID
export function getCityById(id: string): CityData | undefined {
  return citiesData.find(city => city.id === id);
}

// Helper function to check if destination requires visa for US citizens
export function isVisaFreeForUS(city: CityData): boolean {
  const visaFreeCountries = [
    "United States", "Canada", "Mexico", "United Kingdom", "Ireland", "France",
    "Germany", "Italy", "Spain", "Portugal", "Netherlands", "Belgium", "Switzerland",
    "Austria", "Denmark", "Sweden", "Norway", "Finland", "Iceland", "Greece",
    "Japan", "South Korea", "Taiwan", "Singapore", "Australia", "New Zealand",
    "Chile", "Argentina", "Brazil", "Uruguay", "Costa Rica", "Panama"
  ];
  return visaFreeCountries.includes(city.country);
}
`;

// Write to cities-data.ts
const outputPath = path.join(__dirname, '../lib/cities-data.ts');
fs.writeFileSync(outputPath, tsCode);

console.log(`✓ Updated ${outputPath} with ${cities.length} destinations`);
