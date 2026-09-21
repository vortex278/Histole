export type EventCard = {
  eventId: number;
  name: string;
  image: string;
  year: string;
  state: string;
  era: string;
  scale: string;
  tag: string;
};

export type AttributeStatus = "correct" | "close" | "incorrect";

const ERA_ORDER = ["Colonial", "American Revolution", "New Nation", "National Expansion", "Civil War", "Industrial America", "Progressive Era", "World War II", "Post War", "Modern Era"];
const SCALE_ORDER = ["Local", "State", "Regional", "National", "International"];

const STATE_BORDERS: Record<string, string[]> = {
  Alabama: ["Florida", "Georgia", "Mississippi", "Tennessee"],
  Alaska: [],
  Arizona: ["California", "Colorado", "Nevada", "New Mexico", "Utah"],
  Arkansas: ["Louisiana", "Mississippi", "Missouri", "Oklahoma", "Tennessee", "Texas"],
  California: ["Arizona", "Nevada", "Oregon"],
  Colorado: ["Arizona", "Kansas", "Nebraska", "New Mexico", "Oklahoma", "Utah", "Wyoming"],
  Connecticut: ["Massachusetts", "New York", "Rhode Island"],
  Delaware: ["Maryland", "New Jersey", "Pennsylvania"],
  Florida: ["Alabama", "Georgia"],
  Georgia: ["Alabama", "Florida", "North Carolina", "South Carolina", "Tennessee"],
  Hawaii: [],
  Idaho: ["Montana", "Nevada", "Oregon", "Utah", "Washington", "Wyoming"],
  Illinois: ["Iowa", "Indiana", "Kentucky", "Missouri", "Wisconsin"],
  Indiana: ["Illinois", "Kentucky", "Michigan", "Ohio"],
  Iowa: ["Illinois", "Minnesota", "Missouri", "Nebraska", "South Dakota", "Wisconsin"],
  Kansas: ["Colorado", "Missouri", "Nebraska", "Oklahoma"],
  Kentucky: ["Illinois", "Indiana", "Missouri", "Ohio", "Tennessee", "Virginia", "West Virginia"],
  Louisiana: ["Arkansas", "Mississippi", "Texas"],
  Maine: ["New Hampshire"],
  Maryland: ["Delaware", "Pennsylvania", "Virginia", "West Virginia"],
  Massachusetts: ["Connecticut", "New Hampshire", "New York", "Rhode Island", "Vermont"],
  Michigan: ["Indiana", "Ohio", "Wisconsin"],
  Minnesota: ["Iowa", "Michigan", "North Dakota", "South Dakota", "Wisconsin"],
  Mississippi: ["Alabama", "Arkansas", "Louisiana", "Tennessee"],
  Missouri: ["Arkansas", "Illinois", "Iowa", "Kansas", "Kentucky", "Nebraska", "Oklahoma", "Tennessee"],
  Montana: ["Idaho", "North Dakota", "South Dakota", "Wyoming"],
  Nebraska: ["Colorado", "Iowa", "Kansas", "Missouri", "South Dakota", "Wyoming"],
  Nevada: ["Arizona", "California", "Idaho", "Oregon", "Utah"],
  "New Hampshire": ["Maine", "Massachusetts", "Vermont"],
  "New Jersey": ["Delaware", "New York", "Pennsylvania"],
  "New Mexico": ["Arizona", "Colorado", "Oklahoma", "Texas", "Utah"],
  "New York": ["Connecticut", "Massachusetts", "New Jersey", "Pennsylvania", "Vermont"],
  "North Carolina": ["Georgia", "South Carolina", "Tennessee", "Virginia"],
  "North Dakota": ["Minnesota", "Montana", "South Dakota"],
  Ohio: ["Indiana", "Kentucky", "Michigan", "Pennsylvania", "West Virginia"],
  Oklahoma: ["Arkansas", "Colorado", "Kansas", "Missouri", "New Mexico", "Texas"],
  Oregon: ["California", "Idaho", "Nevada", "Washington"],
  Pennsylvania: ["Delaware", "Maryland", "New Jersey", "New York", "Ohio", "West Virginia"],
  "Rhode Island": ["Connecticut", "Massachusetts"],
  "South Carolina": ["Georgia", "North Carolina"],
  "South Dakota": ["Iowa", "Minnesota", "Montana", "Nebraska", "North Dakota", "Wyoming"],
  Tennessee: ["Alabama", "Arkansas", "Georgia", "Kentucky", "Mississippi", "Missouri", "North Carolina", "Virginia"],
  Texas: ["Arkansas", "Louisiana", "New Mexico", "Oklahoma"],
  Utah: ["Arizona", "Colorado", "Idaho", "Nevada", "New Mexico", "Wyoming"],
  Vermont: ["Massachusetts", "New Hampshire", "New York"],
  Virginia: ["Kentucky", "Maryland", "North Carolina", "Tennessee", "West Virginia"],
  Washington: ["Idaho", "Oregon"],
  "West Virginia": ["Kentucky", "Maryland", "Ohio", "Pennsylvania", "Virginia"],
  Wisconsin: ["Iowa", "Illinois", "Michigan", "Minnesota"],
  Wyoming: ["Colorado", "Idaho", "Montana", "Nebraska", "South Dakota", "Utah"],
};

const normalize = (value: string) => value.trim().toLowerCase();

const distanceBetween = (values: string[], first: string, second: string) => {
  const firstIndex = values.findIndex((value) => normalize(value) === normalize(first));
  const secondIndex = values.findIndex((value) => normalize(value) === normalize(second));

  if (firstIndex === -1 || secondIndex === -1) {
    return Infinity;
  }

  return Math.abs(firstIndex - secondIndex);
};

export const getYearStatus = (guess: string, target: string): AttributeStatus => {
  const guessYear = Number(guess);
  const targetYear = Number(target);

  if (!Number.isFinite(guessYear) || !Number.isFinite(targetYear)) {
    return "incorrect";
  }

  if (guessYear === targetYear) {
    return "correct";
  }

  return Math.abs(guessYear - targetYear) <= 10 ? "close" : "incorrect";
};

export const getStateStatus = (guess: string, target: string): AttributeStatus => {
  if (normalize(guess) === normalize(target)) {
    return "correct";
  }

  const borderingStates = STATE_BORDERS[target] ?? [];
  return borderingStates.some((state) => normalize(state) === normalize(guess))
    ? "close"
    : "incorrect";
};

export const getTagStatus = (guess: string, target: string): AttributeStatus =>
  normalize(guess) === normalize(target) ? "correct" : "incorrect";

export const getEraStatus = (guess: string, target: string): AttributeStatus => {
  const distance = distanceBetween(ERA_ORDER, guess, target);

  if (distance === 0) {
    return "correct";
  }

  return distance === 1 ? "close" : "incorrect";
};

export const getScaleStatus = (guess: string, target: string): AttributeStatus => {
  const distance = distanceBetween(SCALE_ORDER, guess, target);

  if (distance === 0) {
    return "correct";
  }

  return distance === 1 ? "close" : "incorrect";
};

export const getAttributeColor = (status: AttributeStatus) => {
  switch (status) {
    case "correct":
      return "#4caf50";
    case "close":
      return "#f2c94c";
    default:
      return "#9aa0a6";
  }
};