// Script to convert CSV to TypeScript cities array
const fs = require('fs');

const csvPath = './user_read_only_context/text_attachments/world_destinations_batch_1A-A1K9j.csv';
const csv = fs.readFileSync(csvPath, 'utf-8');

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
    "Paraguay": "South America", "United Kingdom": "Europe", "Ireland": "Europe",
    "France": "Europe", "Germany": "Europe", "Italy": "Europe", "Spain": "Europe",
    "Portugal": "Europe", "Netherlands": "Europe", "Belgium": "Europe", "Switzerland": "Europe",
    "Austria": "Europe", "Denmark": "Europe", "Sweden": "Europe", "Norway": "Europe",
    "Finland": "Europe", "Poland": "Europe", "Czech Republic": "Europe", "Hungary": "Europe",
    "Croatia": "Europe", "Greece": "Europe", "Turkey": "Europe", "Estonia": "Europe",
    "Latvia": "Europe", "Lithuania": "Europe", "Slovenia": "Europe", "Slovakia": "Europe",
    "Bulgaria": "Europe", "Romania": "Europe", "Serbia": "Europe", "Iceland": "Europe",
    "Bosnia and Herzegovina": "Europe", "North Macedonia": "Europe", "Albania": "Europe",
    "Montenegro": "Europe", "Kosovo": "Europe", "Moldova": "Europe", "Ukraine": "Europe",
    "Georgia": "Asia", "Armenia": "Asia", "Azerbaijan": "Asia", "Japan": "Asia",
    "China": "Asia", "Taiwan": "Asia", "South Korea": "Asia", "Thailand": "Asia",
    "Vietnam": "Asia", "Singapore": "Asia", "Malaysia": "Asia", "Indonesia": "Asia",
    "Philippines": "Asia", "India": "Asia", "Nepal": "Asia", "Sri Lanka": "Asia",
    "Maldives": "Asia", "Kazakhstan": "Asia", "Uzbekistan": "Asia", "Kyrgyzstan": "Asia",
    "Cambodia": "Asia", "Laos": "Asia", "Myanmar": "Asia", "Bangladesh": "Asia",
    "United Arab Emirates": "Middle East", "Qatar": "Middle East", "Oman": "Middle East",
    "Saudi Arabia": "Middle East", "Kuwait": "Middle East", "Bahrain": "Middle East",
    "Israel": "Middle East", "Jordan": "Middle East", "Lebanon": "Middle East",
    "Iraq": "Middle East", "Iran": "Middle East", "Egypt": "Africa", "Morocco": "Africa",
    "Tunisia": "Africa", "Algeria": "Africa", "South Africa": "Africa", "Kenya": "Africa",
    "Tanzania": "Africa", "Rwanda": "Africa", "Ethiopia": "Africa", "Ghana": "Africa",
    "Nigeria": "Africa", "Senegal": "Africa", "Ivory Coast": "Africa", "Gambia": "Africa",
    "Namibia": "Africa", "Zimbabwe": "Africa", "Botswana": "Africa", "Mozambique": "Africa",
    "Madagascar": "Africa", "Seychelles": "Africa", "Mauritius": "Africa", "Reunion": "Africa",
    "Mali": "Africa", "Burkina Faso": "Africa", "Niger": "Africa", "Mauritania": "Africa",
    "Togo": "Africa", "Australia": "Oceania", "New Zealand": "Oceania", "Fiji": "Oceania",
    "Papua New Guinea": "Oceania", "French Polynesia": "Oceania", "Samoa": "Oceania",
    "Solomon Islands": "Oceania", "Palau": "Oceania",
  };
  return regionMap[country] || "Other";
}

function parseMonths(monthsStr) {
  if (!monthsStr || monthsStr.trim() === '') return [];
  return monthsStr.replace(/"/g, '').split(',').map(m => parseInt(m.trim())).filter(n => !isNaN(n));
}

function generateId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
}

const lines = csv.split('\n').filter(line => line.trim());
const cities = [];
const seen = new Set();

// Skip header
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line (handle quoted fields)
  const parts = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current.trim());
  
  if (parts.length < 4) continue;
  
  const [name, country, airportCode, highSeason, shoulderSeason] = parts;
  
  const id = generateId(name);
  const key = `${name}-${airportCode}`;
  
  // Skip duplicates
  if (seen.has(key)) continue;
  seen.add(key);
  
  const region = getRegion(country);
  const bestMonths = parseMonths(highSeason);
  const shoulderMonths = parseMonths(shoulderSeason);
  
  cities.push({
    id,
    name,
    country,
    region,
    airportCode,
    type: "city",
    bestMonths: bestMonths.length > 0 ? bestMonths : undefined,
    shoulderMonths: shoulderMonths.length > 0 ? shoulderMonths : undefined,
  });
}

console.log(`// Generated ${cities.length} cities from CSV`);
console.log('export const CITIES: CityData[] = [');
cities.forEach((city, i) => {
  const best = city.bestMonths ? `bestMonths: [${city.bestMonths.join(',')}]` : '';
  const shoulder = city.shoulderMonths ? `shoulderMonths: [${city.shoulderMonths.join(',')}]` : '';
  const months = [best, shoulder].filter(Boolean).join(', ');
  console.log(`  { id: "${city.id}", name: "${city.name}", country: "${city.country}", region: "${city.region}", airportCode: "${city.airportCode}", type: "city"${months ? ', ' + months : ''} }${i < cities.length - 1 ? ',' : ''}`);
});
console.log('];');
