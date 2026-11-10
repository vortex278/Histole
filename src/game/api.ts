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
  const responseText = await response.text();
  let body: T & { error?: string };

  try {
    body = JSON.parse(responseText) as T & { error?: string };
  } catch {
    throw new Error(
      `API returned a non-JSON response (${response.status}). Check that Django is running at ${API_BASE_URL}.`,
    );
  }

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
