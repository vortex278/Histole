import { GameCardColors } from "@/constants/theme";

export type EventCard = {
  eventId: number;
  name: string;
  image: string;
  year: string;
  state: string;
  era: string;
  eraStartYear?: number;
  eraEndYear?: number;
  scale: string;
  scaleOrder?: number;
  tag: string;
  description?: string;
};

export type AttributeStatus = "correct" | "close" | "incorrect";
export type YearDirection = "up" | "down" | null;
export type StateDirection =
  | "left"
  | "right"
  | "up"
  | "down"
  | "southeast"
  | "southwest"
  | "northeast"
  | "northwest"
  | null;

const STATE_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  Alabama: { latitude: 32.8, longitude: -86.8 },
  Alaska: { latitude: 64.2, longitude: -149.5 },
  Arizona: { latitude: 34.3, longitude: -111.7 },
  Arkansas: { latitude: 34.8, longitude: -92.2 },
  California: { latitude: 37.2, longitude: -119.5 },
  Colorado: { latitude: 39, longitude: -105.5 },
  Connecticut: { latitude: 41.6, longitude: -72.7 },
  Delaware: { latitude: 39, longitude: -75.5 },
  Florida: { latitude: 28.6, longitude: -82.4 },
  Georgia: { latitude: 32.7, longitude: -83.5 },
  Hawaii: { latitude: 20.8, longitude: -156.3 },
  Idaho: { latitude: 44.4, longitude: -114.6 },
  Illinois: { latitude: 40, longitude: -89.2 },
  Indiana: { latitude: 39.9, longitude: -86.3 },
  Iowa: { latitude: 42, longitude: -93.5 },
  Kansas: { latitude: 38.5, longitude: -98.4 },
  Kentucky: { latitude: 37.5, longitude: -85.3 },
  Louisiana: { latitude: 31, longitude: -92 },
  Maine: { latitude: 45.3, longitude: -69.2 },
  Maryland: { latitude: 39, longitude: -76.7 },
  Massachusetts: { latitude: 42.3, longitude: -71.8 },
  Michigan: { latitude: 44.3, longitude: -85.6 },
  Minnesota: { latitude: 46.3, longitude: -94.3 },
  Mississippi: { latitude: 32.7, longitude: -89.7 },
  Missouri: { latitude: 38.5, longitude: -92.5 },
  Montana: { latitude: 47, longitude: -110 },
  Nebraska: { latitude: 41.5, longitude: -99.8 },
  Nevada: { latitude: 39.3, longitude: -116.6 },
  "New Hampshire": { latitude: 43.7, longitude: -71.6 },
  "New Jersey": { latitude: 40.1, longitude: -74.7 },
  "New Mexico": { latitude: 34.4, longitude: -106.1 },
  "New York": { latitude: 42.9, longitude: -75.5 },
  "North Carolina": { latitude: 35.5, longitude: -79.4 },
  "North Dakota": { latitude: 47.5, longitude: -100.5 },
  Ohio: { latitude: 40.4, longitude: -82.8 },
  Oklahoma: { latitude: 35.6, longitude: -97.5 },
  Oregon: { latitude: 44, longitude: -120.5 },
  Pennsylvania: { latitude: 40.9, longitude: -77.8 },
  "Rhode Island": { latitude: 41.7, longitude: -71.5 },
  "South Carolina": { latitude: 33.8, longitude: -80.9 },
  "South Dakota": { latitude: 44.4, longitude: -100.2 },
  Tennessee: { latitude: 35.8, longitude: -86.4 },
  Texas: { latitude: 31.5, longitude: -99.3 },
  Utah: { latitude: 39.3, longitude: -111.7 },
  Vermont: { latitude: 44, longitude: -72.7 },
  Virginia: { latitude: 37.5, longitude: -79 },
  Washington: { latitude: 47.4, longitude: -120.5 },
  "West Virginia": { latitude: 38.6, longitude: -80.6 },
  Wisconsin: { latitude: 44.5, longitude: -89.5 },
  Wyoming: { latitude: 43, longitude: -107.5 },
};

const normalize = (value: string) => value.trim().toLowerCase();

export const findEventByName = (events: EventCard[], query: string): EventCard | undefined => {
  const normalizedQuery = normalize(query);
  return events.find((event) => normalize(event.name) === normalizedQuery);
};

export const getYearDirection = (guess: string, target: string): YearDirection => {
  const guessYear = Number(guess);
  const targetYear = Number(target);

  if (!Number.isFinite(guessYear) || !Number.isFinite(targetYear) || guessYear === targetYear) {
    return null;
  }

  return targetYear > guessYear ? "up" : "down";
};

export const getStateDirection = (guess: string, target: string): StateDirection => {
  const guessCoordinates = Object.entries(STATE_COORDINATES).find(
    ([state]) => normalize(state) === normalize(guess),
  )?.[1];
  const targetCoordinates = Object.entries(STATE_COORDINATES).find(
    ([state]) => normalize(state) === normalize(target),
  )?.[1];

  if (!guessCoordinates || !targetCoordinates || normalize(guess) === normalize(target)) {
    return null;
  }

  const longitudeDelta = targetCoordinates.longitude - guessCoordinates.longitude;
  const latitudeDelta = targetCoordinates.latitude - guessCoordinates.latitude;

  const horizontalDistance = Math.abs(longitudeDelta);
  const verticalDistance = Math.abs(latitudeDelta);

  if (horizontalDistance >= verticalDistance * 2.5) {
    return longitudeDelta > 0 ? "right" : "left";
  }

  if (verticalDistance >= horizontalDistance * 2.5) {
    return latitudeDelta > 0 ? "up" : "down";
  }

  if (longitudeDelta > 0) {
    return latitudeDelta > 0 ? "northeast" : "southeast";
  }

  return latitudeDelta > 0 ? "northwest" : "southwest";
};

export const getAttributeColor = (status: AttributeStatus) => {
  switch (status) {
    case "correct":
      return GameCardColors.correct;
    case "close":
      return GameCardColors.close;
    default:
      return GameCardColors.incorrect;
  }
};
