import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { createSession, fetchEvents, GuessStatuses, submitGuess } from "@/game/api";
import {
    EventCard,
    findEventByName,
    getAttributeColor,
    getStateDirection,
    getYearDirection,
} from "@/game/event-logic";

type GuessCard = {
  event: EventCard;
  statuses: GuessStatuses;
};

export default function Index() {
  const [targetEvent, setTargetEvent] = useState<EventCard>();
  const [sessionId, setSessionId] = useState<number>();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [guessText, setGuessText] = useState("");
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
  const [guesses, setGuesses] = useState<GuessCard[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGameWon, setIsGameWon] = useState(false);
  const [wonEvent, setWonEvent] = useState<EventCard>();
  const [isGameOverModalVisible, setIsGameOverModalVisible] = useState(false);
  const [isWinModalVisible, setIsWinModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const maxGuesses = 15;
  const isGameLost = guesses.length >= maxGuesses && !isGameWon;
  const isGameOver = isGameWon || isGameLost;
  const eventSuggestions = events.filter((event) =>
    event.name.toLowerCase().includes(guessText.trim().toLowerCase()),
  ).slice(0, 10);

  useEffect(() => {
    const loadGame = async () => {
      try {
        const catalog = await fetchEvents();
        const session = await createSession();
        setEvents(catalog);
        setTargetEvent(session.target);
        setSessionId(session.sessionId);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Unable to connect to the game server.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadGame();
  }, []);

  const submitGuessForGame = async () => {
    setIsSuggestionVisible(false);

    if (isGameOver || !sessionId || !targetEvent) {
      return;
    }

    const nextEvent = findEventByName(events, guessText);

    if (!nextEvent) {
      setErrorMessage("Choose an event from the event suggestions.");
      return;
    }

    if (guesses.some((guess) => guess.event.eventId === nextEvent.eventId)) {
      setErrorMessage("Event has already been guessed.");
      return;
    }

    try {
      const result = await submitGuess(sessionId, nextEvent.eventId);
      setGuesses((previousGuesses) => [
        { event: result.event, statuses: result.statuses },
        ...previousGuesses,
      ]);
      setIsGameWon(result.solved);
      if (result.solved) {
        setWonEvent(result.event);
        setIsWinModalVisible(true);
      }
      if (!result.solved && guesses.length + 1 >= maxGuesses) {
        setIsGameOverModalVisible(true);
      }
      setGuessText("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit your guess.");
    }
  };
  const selectSuggestion = (eventName: string) => {
    setGuessText(eventName);
    setIsSuggestionVisible(false);
    setErrorMessage("");
  };

  if (isLoading) {
    return <View style={styles.centered}><Text style={styles.title}>Loading Histole...</Text></View>;
  }

  if (apiError || !targetEvent) {
    return <View style={styles.centered}><Text style={styles.errorMessage}>{apiError || "Game data is unavailable."}</Text></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Histole!</Text>
      <Text style={styles.guessCount}>
        Guesses: {guesses.length} / {maxGuesses}
      </Text>
      {!isGameWon && <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          value={guessText}
          onChangeText={(text) => {
            setGuessText(text);
            setIsSuggestionVisible(true);
          }}
          onFocus={() => setIsSuggestionVisible(true)}
          placeholder="Enter your guess"
          placeholderTextColor="#8f9498"
          returnKeyType="done"
          onSubmitEditing={submitGuessForGame}
          editable={!isGameOver}
        />
        {isSuggestionVisible && eventSuggestions.length > 0 && (
          <ScrollView
            style={styles.suggestionList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {eventSuggestions.map((event) => (
              <Pressable
                key={event.eventId}
                style={styles.suggestion}
                onPress={() => selectSuggestion(event.name)}
              >
                <Text style={styles.suggestionText}>{event.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>}
      {errorMessage.length > 0 && <Text style={styles.errorMessage}>{errorMessage}</Text>}
      {!isGameWon && <Pressable style={styles.button} onPress={submitGuessForGame} disabled={isGameOver}>
        <Text style={styles.buttonText}>Submit Guess</Text>
      </Pressable>}
      {isGameWon && <Text style={styles.successMessage}>You got it! Today&apos;s event is {targetEvent.name}.</Text>}
      {guesses.map(({ event: eventCard, statuses }) => {
        const yearDirection = getYearDirection(eventCard.year, targetEvent.year);
        const stateDirection = getStateDirection(eventCard.state, targetEvent.state);

        return (
          <View style={styles.gameCard} key={eventCard.eventId}>
            <View style={styles.eventHeader}>
              <Image
                source={{ uri: eventCard.image }}
                style={styles.eventImage}
              />

              <View style={styles.eventTitleContainer}>
                <Text style={styles.eventName}>{eventCard.name}</Text>
              </View>
            </View>

            <View style={styles.attributeGrid}>
              <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(statuses.year) }]}>
                <Text
                  style={styles.attributeValue}
                  accessibilityLabel={`Year ${eventCard.year}${yearDirection === "up" ? ", guess a greater year" : yearDirection === "down" ? ", guess a lesser year" : ""}`}
                >
                  {eventCard.year}
                  {yearDirection && <Text style={styles.yearDirection}> {yearDirection === "up" ? "↑" : "↓"}</Text>}
                </Text>
                <Text style={styles.attributeLabel}>Year</Text>
              </View>

              <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(statuses.state) }]}>
                <Text
                  style={styles.attributeValue}
                  accessibilityLabel={`State ${eventCard.state}${stateDirection ? `, target is ${stateDirection}` : ""}`}
                >
                  {eventCard.state}
                  {stateDirection && (
                    <Text style={styles.yearDirection}>
                      {" "}
                      {{
                        left: "←",
                        right: "→",
                        up: "↑",
                        down: "↓",
                        southeast: "↘",
                        southwest: "↙",
                        northeast: "↗",
                        northwest: "↖",
                      }[stateDirection]}
                    </Text>
                  )}
                </Text>
                <Text style={styles.attributeLabel}>State</Text>
              </View>

              <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(statuses.era) }]}>
                <Text style={styles.attributeValue}>{eventCard.era}</Text>
                <Text style={styles.eraRange}>{eventCard.eraStartYear}-{eventCard.eraEndYear}</Text>
                <Text style={styles.attributeLabel}>Era</Text>
              </View>

              <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(statuses.scale) }]}>
                <Text style={styles.attributeValue}>{eventCard.scale}</Text>
                <Text style={styles.attributeLabel}>Scale</Text>
              </View>

              <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(statuses.tag) }]}>
                <Text style={styles.attributeValue}>{eventCard.tag}</Text>
                <Text style={styles.attributeLabel}>Tag</Text>
              </View>
            </View>
          </View>
        );
      })}
      <Modal
        animationType="fade"
        transparent
        visible={isWinModalVisible}
        onRequestClose={() => setIsWinModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.gameOverModal}>
            <Pressable
              accessibilityLabel="Close win dialog"
              onPress={() => setIsWinModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
            <Text style={styles.winTitle}>You Win!</Text>
            <Image
              source={{ uri: wonEvent?.image ?? targetEvent.image }}
              style={styles.answerImage}
            />
            <Text style={styles.answerName}>{wonEvent?.name ?? targetEvent.name}</Text>
            <Text style={styles.eventInformationTitle}>Event Information</Text>
            <Text style={styles.eventInformation}>
              {wonEvent?.description || targetEvent.description || "Event information coming soon."}
            </Text>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={isGameLost && isGameOverModalVisible}
        onRequestClose={() => setIsGameOverModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.gameOverModal}>
            <Pressable
              accessibilityLabel="Close game over dialog"
              onPress={() => setIsGameOverModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
            <Text style={styles.gameOverTitle}>Game Over</Text>
            <Text style={styles.gameOverMessage}>
              The answer was:
            </Text>
            <Image
              source={{ uri: targetEvent.image }}
              style={styles.answerImage}
            />
            <Text style={styles.answerName}>{targetEvent.name}</Text>
            <Text style={styles.answerDetails}>
              {targetEvent.year} · {targetEvent.state}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2f3234",
    padding: 24,
  },
  screen: {
    flex: 1,
    backgroundColor: "#2f3234",
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 32,
    backgroundColor: "#2f3234",
  },
  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  inputSection: {
    width: "90%",
    maxWidth: 480,
    marginTop: 32,
    zIndex: 1,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f3",
    color: "#202224",
    fontSize: 16,
  },
  suggestionList: {
    maxHeight: 240,
    overflow: "hidden",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#d5d7da",
  },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e6e8",
  },
  suggestionText: {
    color: "#202224",
    fontSize: 16,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f3",
  },
  buttonText: {
    color: "#202224",
    fontSize: 16,
    fontWeight: "600",
  },
  gameCard: {
    width: "90%",
    maxWidth: 540,
    marginTop: 32,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f0f0f3",
  },
  eventTitleContainer: {
    flex: 1,
    marginLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f3",
    paddingBottom: 8,
  },
  eventName: {
    color: "#ffffff",
    fontSize: 22,
  },
  attributeGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  attributeCard: {
    width: "30%",
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f3",
  },
  attributeValue: {
    color: "#202224",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  yearDirection: {
    fontSize: 20,
    fontWeight: "700",
  },
  eraRange: {
    marginTop: 2,
    color: "#202224",
    fontSize: 12,
  },
  attributeLabel: {
    marginTop: 4,
    color: "#60646c",
    fontSize: 13,
  },
  guessCount: {
    marginTop: 16,
    color: "#ffffff",
    fontSize: 16,
  },
  errorMessage: {
    marginTop: 12,
    color: "#f2c94c",
    fontSize: 14,
  },
  successMessage: {
    marginTop: 24,
    color: "#4caf50",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  gameOverModal: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    padding: 28,
    borderRadius: 16,
    backgroundColor: "#f0f0f3",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  closeButtonText: {
    color: "#60646c",
    fontSize: 28,
    lineHeight: 28,
  },
  gameOverTitle: {
    color: "#202224",
    fontSize: 28,
    fontWeight: "700",
  },
  winTitle: {
    color: "#4caf50",
    fontSize: 28,
    fontWeight: "700",
  },
  gameOverMessage: {
    marginTop: 12,
    color: "#60646c",
    fontSize: 16,
  },
  answerImage: {
    width: 96,
    height: 96,
    marginTop: 20,
    borderRadius: 48,
    backgroundColor: "#d5d7da",
  },
  answerName: {
    marginTop: 16,
    color: "#202224",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  answerDetails: {
    marginTop: 8,
    color: "#60646c",
    fontSize: 16,
  },
  eventInformation: {
    marginTop: 16,
    color: "#60646c",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  eventInformationTitle: {
    marginTop: 16,
    color: "#202224",
    fontSize: 14,
    fontWeight: "700",
  },
});
