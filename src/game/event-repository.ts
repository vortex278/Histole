import { EventCard } from "@/game/event-logic";
import { MOCK_EVENTS } from "@/game/mock-events";

const getUtcDateKey = () => new Date().toISOString().slice(0, 10);

const getDateIndex = (dateKey: string, eventCount: number) => {
  const dateNumber = Number(dateKey.replaceAll("-", ""));
  return dateNumber % eventCount;
};

export const getDailyTarget = (): EventCard => {
  return MOCK_EVENTS[getDateIndex(getUtcDateKey(), MOCK_EVENTS.length)];
};

export const findEventByName = (query: string): EventCard | undefined => {
  const normalizedQuery = query.trim().toLowerCase();

  return MOCK_EVENTS.find((event) => event.name.toLowerCase() === normalizedQuery);
};

export const findEventSuggestions = (query: string): EventCard[] => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return MOCK_EVENTS.filter((event) => event.name.toLowerCase().includes(normalizedQuery)).slice(0, 10);
};