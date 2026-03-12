import { CityData } from "./cities-data";

export interface TripData {
  id: string;
  name: string;
  invite_code: string;
  alias?: string;
  created_at: string;
}

export interface Participant {
  id: string;
  blend_id: string;
  name: string;
  home_airport: string | null;
  created_at: string;
}

export interface AvailabilityVote {
  id: string;
  blend_id: string;
  participant_id: string;
  year_month: string;
  created_at: string;
}

export interface DestinationPick {
  id: string;
  blend_id: string;
  participant_id: string;
  destination_key: string;
  destination_data: CityData | null;
  interest_level: number;
  created_at: string;
}

export interface AvoidedDestination {
  id: string;
  blend_id: string;
  participant_id: string;
  destination_key: string;
  destination_data: CityData | null;
  created_at: string;
}

// Data store types
interface AppData {
  blends: TripData[];
  participants: Participant[];
  availability: AvailabilityVote[];
  destinations: DestinationPick[];
  avoided_destinations: AvoidedDestination[];
}

// Default empty state
const defaultData: AppData = {
  blends: [],
  participants: [],
  availability: [],
  destinations: [],
  avoided_destinations: [],
};

const STORAGE_KEY = "tripblend_mock_db";

function loadData(): AppData {
  if (typeof window === "undefined") return defaultData;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultData;
  try {
    return JSON.parse(raw) as AppData;
  } catch (e) {
    return defaultData;
  }
}

function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Helper to generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

// Blends
export function getBlendByCodeOrAlias(code: string): TripData | null {
  const data = loadData();
  const searchCode = code.toLowerCase();
  return data.blends.find(b => b.invite_code.toLowerCase() === searchCode || b.alias?.toLowerCase() === searchCode) || null;
}

export function getBlendByName(name: string): TripData | null {
  const data = loadData();
  return data.blends.find(b => b.name === name) || null;
}

export function createBlend(blend: Omit<TripData, 'id' | 'created_at'>): TripData {
  const data = loadData();
  const newBlend: TripData = {
    ...blend,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  data.blends.push(newBlend);
  saveData(data);
  return newBlend;
}

export function updateBlend(id: string, updates: Partial<TripData>): TripData | null {
  const data = loadData();
  const index = data.blends.findIndex(b => b.id === id);
  if (index === -1) return null;
  data.blends[index] = { ...data.blends[index], ...updates };
  saveData(data);
  return data.blends[index];
}

// Participants
export function getParticipantsByBlendId(blendId: string): Participant[] {
  const data = loadData();
  return data.participants.filter(p => p.blend_id === blendId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function createParticipant(participant: Omit<Participant, 'id' | 'created_at'>): Participant {
  const data = loadData();
  const newParticipant: Participant = {
    ...participant,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  data.participants.push(newParticipant);
  saveData(data);
  return newParticipant;
}

export function updateParticipant(id: string, updates: Partial<Participant>): Participant | null {
  const data = loadData();
  const index = data.participants.findIndex(p => p.id === id);
  if (index === -1) return null;
  data.participants[index] = { ...data.participants[index], ...updates };
  saveData(data);
  return data.participants[index];
}

export function deleteParticipant(id: string) {
  const data = loadData();
  data.participants = data.participants.filter(p => p.id !== id);
  // Also delete associated data
  data.availability = data.availability.filter(a => a.participant_id !== id);
  data.destinations = data.destinations.filter(d => d.participant_id !== id);
  data.avoided_destinations = data.avoided_destinations.filter(d => d.participant_id !== id);
  saveData(data);
}

// Availability
export function getAvailabilityByParticipantIds(participantIds: string[]): AvailabilityVote[] {
  const data = loadData();
  return data.availability.filter(a => participantIds.includes(a.participant_id));
}

export function createAvailability(availability: Omit<AvailabilityVote, 'id' | 'created_at'>): AvailabilityVote {
  const data = loadData();
  const newAvailability: AvailabilityVote = {
    ...availability,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  data.availability.push(newAvailability);
  saveData(data);
  return newAvailability;
}

export function deleteAvailability(participantId: string, yearMonth: string) {
  const data = loadData();
  data.availability = data.availability.filter(a => !(a.participant_id === participantId && a.year_month === yearMonth));
  saveData(data);
}

export function getDestinationsByParticipantIds(participantIds: string[]): DestinationPick[] {
  const data = loadData();
  return data.destinations.filter(d => participantIds.includes(d.participant_id));
}

export function createDestination(destination: Omit<DestinationPick, 'id' | 'created_at'>): DestinationPick {
  const data = loadData();
  const newDest: DestinationPick = {
    ...destination,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  data.destinations.push(newDest);
  saveData(data);
  return newDest;
}

export function deleteDestination(id: string) {
  const data = loadData();
  data.destinations = data.destinations.filter(d => d.id !== id);
  saveData(data);
}

export function getAvoidedDestinationsByParticipantIds(participantIds: string[]): AvoidedDestination[] {
  const data = loadData();
  return data.avoided_destinations.filter(d => participantIds.includes(d.participant_id));
}

export function createAvoidedDestination(destination: Omit<AvoidedDestination, 'id' | 'created_at'>): AvoidedDestination {
  const data = loadData();
  const newDest: AvoidedDestination = {
    ...destination,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  data.avoided_destinations.push(newDest);
  saveData(data);
  return newDest;
}

export function deleteAvoidedDestination(id: string) {
  const data = loadData();
  data.avoided_destinations = data.avoided_destinations.filter(d => d.id !== id);
  saveData(data);
}
