export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export interface Trip {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface TripParticipant {
  id: string;
  trip_id: string;
  name: string;
  created_at: string;
}

export interface TripDestination {
  id: string;
  trip_id: string;
  participant_id: string;
  destination_key: string;
  created_at: string;
}

export interface TripAvailability {
  id: string;
  trip_id: string;
  participant_id: string;
  year_month: string;
  created_at: string;
}
