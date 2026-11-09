import { EventCard } from "@/game/event-logic";
import { API_BASE_URL } from "@/constants/api";

type EventsResponse = { events: EventCard[] };
type SessionResponse = { sessionId: number; target: EventCard };

export type GuessResponse = {
  event: EventCard;
  statuses: {
    year: "correct" | "close" | "incorrect";
    state: "correct" | "close" | "incorrect";
    era: "correct" | "close" | "incorrect";
    scale: "correct" | "close" | "incorrect";
    tag: "correct" | "close" | "incorrect";
  };
  solved: boolean;
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await response.json() as T & { error?: string };

  if (!response.ok) {
    throw new Error(body.error ?? `API request failed (${response.status}).`);
  }

  return body;
};

export const fetchEvents = async () => (await request<EventsResponse>("/events")).events;

export const createSession = async () =>
  request<SessionResponse>("/sessions", { method: "POST", body: "{}" });

export const submitGuess = async (sessionId: number, guessedEventId: number) =>
  request<GuessResponse>(`/sessions/${sessionId}/guesses`, {
    method: "POST",
    body: JSON.stringify({ guessedEventId }),
  });
