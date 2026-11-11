import { Image } from "expo-image";
import { Href, Link } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { createSession, fetchEvents, GameMode, GuessStatuses, submitGuess } from "@/game/api";
import { Palette } from "@/constants/theme";
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

type GameScreenProps = {
  mode: GameMode;
};

const TIP_PAGES = [
  {
    title: "How to play",
    text: "Use each guess to learn more about the target event. The feedback cards show how close every attribute is.",
  },
  {
    title: "Colors",
    text: "Green means correct, yellow means close, and cream means the attribute does not match.",
  },
  {
    title: "Year",
    text: "The year arrow points toward an earlier or later target year. A matching year is green.",
  },
  {
    title: "State",
    text: "The state arrow points toward the target state. Use the eight directions to guide your next guess.",
  },
  {
    title: "Era and scale",
    text: "Adjacent eras and geographic scales are close. Use the database-backed ranges and ordering as clues.",
  },
  {
    title: "Tag",
    text: "A matching historical tag is correct. Different tags are not a match.",
  },
] as const;

export default function GameScreen({ mode }: GameScreenProps) {
  const [targetEvent, setTargetEvent] = useState<EventCard>();
  const [sessionId, setSessionId] = useState<number>();
  const [events, setEvents] = useState<EventCard[]>([]);
  const [guessText, setGuessText] = useState("");
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
  const [guesses, setGuesses] = useState<GuessCard[]>([]);
  const [visibleDescriptionId, setVisibleDescriptionId] = useState<number>();
  const [errorMessage, setErrorMessage] = useState("");
  const [isGameWon, setIsGameWon] = useState(false);
  const [wonEvent, setWonEvent] = useState<EventCard>();
  const [isGameOverModalVisible, setIsGameOverModalVisible] = useState(false);
  const [isWinModalVisible, setIsWinModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [tipPage, setTipPage] = useState(0);
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
        setEvents(catalog);
        const session = await createSession(mode);
        setTargetEvent(session.target);
        setSessionId(session.sessionId);
      } catch (error) {
        setApiError(error instanceof Error ? error.message : "Unable to connect to the game server.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadGame();
  }, [mode]);

  const startGame = async (mode: GameMode) => {
    setIsStartingGame(true);
    setErrorMessage("");
    setApiError("");
    try {
      const session = await createSession(mode, mode === "free" ? targetEvent?.eventId : undefined);
      setTargetEvent(session.target);
      setSessionId(session.sessionId);
      setGuesses([]);
      setGuessText("");
      setVisibleDescriptionId(undefined);
      setIsGameWon(false);
      setWonEvent(undefined);
      setIsWinModalVisible(false);
      setIsGameOverModalVisible(false);
      setTipPage(0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start a new game.");
    } finally {
      setIsStartingGame(false);
    }
  };

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
      <Link href={"/" as Href} asChild>
        <Pressable accessibilityRole="button" style={styles.menuButton}>
          <Text style={styles.menuButtonText}>← Main Menu</Text>
        </Pressable>
      </Link>
      <View style={styles.logoFrame}>
        <Image source={require("../../assets/images/histole-logo.png")} style={styles.logo} contentFit="contain" />
      </View>
      <Text style={styles.modeLabel}>{mode === "daily" ? "Daily Game" : "Free Play"}</Text>
      {guesses.length === 0 && (
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Guess an event to reveal clues about its year, state, era, scale, and tag.
          </Text>
        </View>
      )}
      {mode === "free" && isGameOver && (
        <Pressable
          style={styles.modeButton}
          onPress={() => void startGame("free")}
          disabled={isStartingGame}
        >
          <Text style={styles.modeButtonText}>
            {isStartingGame ? "Starting game..." : "Another Free Game"}
          </Text>
        </Pressable>
      )}
      <Text style={styles.guessCount}>
        {isStartingGame ? "Starting game..." : `Guesses: ${guesses.length} / ${maxGuesses}`}
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
          placeholderTextColor={Palette.brown}
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
              <Pressable
                accessibilityLabel={`Show description for ${eventCard.name}`}
                accessibilityHint="Hover or press to learn more about this event"
                onHoverIn={() => setVisibleDescriptionId(eventCard.eventId)}
                onHoverOut={() => setVisibleDescriptionId(undefined)}
                onPress={() =>
                  setVisibleDescriptionId((currentId) =>
                    currentId === eventCard.eventId ? undefined : eventCard.eventId,
                  )
                }
                style={styles.infoButton}
              >
                <Text style={styles.infoIcon}>ⓘ</Text>
              </Pressable>
            </View>
            {visibleDescriptionId === eventCard.eventId && (
              <View style={styles.descriptionPopover}>
                <Text style={styles.descriptionText}>
                  {eventCard.description || "No description is available for this event yet."}
                </Text>
              </View>
            )}

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
      <View style={styles.tipPanel}>
        <Text style={styles.tipHeading}>Tip</Text>
        <Text style={styles.tipTitle}>{TIP_PAGES[tipPage].title}</Text>
        <Text style={styles.tipText}>{TIP_PAGES[tipPage].text}</Text>
        <View style={styles.tipNavigation}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous tip"
            disabled={tipPage === 0}
            onPress={() => setTipPage((page) => Math.max(0, page - 1))}
            style={[styles.tipArrow, tipPage === 0 && styles.tipArrowDisabled]}
          >
            <Text style={styles.tipArrowText}>←</Text>
          </Pressable>
          <Text style={styles.tipPageNumber}>{tipPage + 1} / {TIP_PAGES.length}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next tip"
            disabled={tipPage === TIP_PAGES.length - 1}
            onPress={() => setTipPage((page) => Math.min(TIP_PAGES.length - 1, page + 1))}
            style={[
              styles.tipArrow,
              tipPage === TIP_PAGES.length - 1 && styles.tipArrowDisabled,
            ]}
          >
            <Text style={styles.tipArrowText}>→</Text>
          </Pressable>
        </View>
      </View>
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
            {mode === "daily" && (
              <>
                <Text style={styles.freePlayPrompt}>
                  Want more Histole? Play The Free Play Version!
                </Text>
                <Link href={"/free" as Href} asChild>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setIsWinModalVisible(false)}
                    style={styles.playAgainButton}
                  >
                    <Text style={styles.playAgainButtonText}>Play Free Play</Text>
                  </Pressable>
                </Link>
              </>
            )}
            {mode === "free" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Play Again"
                onPress={() => void startGame("free")}
                disabled={isStartingGame}
                style={styles.playAgainButton}
              >
                <Text style={styles.playAgainButtonText}>
                  {isStartingGame ? "Starting game..." : "Play Again"}
                </Text>
              </Pressable>
            )}
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
            {mode === "daily" && (
              <>
                <Text style={styles.freePlayPrompt}>
                  Want more Histole? Play The Free Play Version!
                </Text>
                <Link href={"/free" as Href} asChild>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setIsGameOverModalVisible(false)}
                    style={styles.playAgainButton}
                  >
                    <Text style={styles.playAgainButtonText}>Play Free Play</Text>
                  </Pressable>
                </Link>
              </>
            )}
            {mode === "free" && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Play Again"
                onPress={() => void startGame("free")}
                disabled={isStartingGame}
                style={styles.playAgainButton}
              >
                <Text style={styles.playAgainButtonText}>
                  {isStartingGame ? "Starting game..." : "Play Again"}
                </Text>
              </Pressable>
            )}
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
    backgroundColor: Palette.brown,
    padding: 24,
  },
  screen: {
    flex: 1,
    backgroundColor: Palette.brown,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 64,
    paddingBottom: 32,
    backgroundColor: Palette.brown,
  },
  title: {
    color: Palette.cream,
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },
  logoFrame: {
    width: 180,
    height: 180,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: Palette.cream,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  menuButton: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Palette.cream,
  },
  menuButtonText: {
    color: Palette.brown,
    fontSize: 15,
    fontWeight: "600",
  },
  modeLabel: {
    marginTop: 8,
    color: Palette.cream,
    fontSize: 16,
  },
  instructions: {
    width: "90%",
    maxWidth: 480,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Palette.cream,
  },
  instructionsText: {
    color: Palette.brown,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  tipPanel: {
    width: "90%",
    maxWidth: 480,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Palette.cream,
  },
  tipHeading: {
    color: Palette.cream,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },
  tipTitle: {
    marginTop: 6,
    color: Palette.cream,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  tipText: {
    marginTop: 4,
    color: Palette.cream,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  tipNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  tipArrow: {
    minWidth: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Palette.cream,
  },
  tipArrowDisabled: {
    opacity: 0.35,
  },
  tipArrowText: {
    color: Palette.brown,
    fontSize: 20,
    textAlign: "center",
  },
  tipPageNumber: {
    color: Palette.cream,
    fontSize: 13,
  },
  modeButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Palette.brown,
  },
  selectedModeButton: {
    backgroundColor: Palette.cream,
  },
  modeButtonText: {
    color: Palette.cream,
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: Palette.cream,
    color: Palette.brown,
    fontSize: 16,
  },
  suggestionList: {
    maxHeight: 240,
    overflow: "hidden",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: Palette.cream,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Palette.cream,
  },
  suggestion: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.brown,
  },
  suggestionText: {
    color: Palette.brown,
    fontSize: 16,
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Palette.cream,
  },
  buttonText: {
    color: Palette.brown,
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
    backgroundColor: Palette.cream,
  },
  eventTitleContainer: {
    flex: 1,
    marginLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cream,
    paddingBottom: 8,
  },
  eventName: {
    color: Palette.cream,
    fontSize: 22,
  },
  infoButton: {
    marginLeft: 12,
    padding: 6,
  },
  infoIcon: {
    color: Palette.cream,
    fontSize: 22,
    fontWeight: "700",
  },
  descriptionPopover: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    backgroundColor: Palette.cream,
  },
  descriptionText: {
    color: Palette.brown,
    fontSize: 15,
    lineHeight: 21,
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
    backgroundColor: Palette.cream,
  },
  attributeValue: {
    color: Palette.brown,
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
    color: Palette.brown,
    fontSize: 12,
  },
  attributeLabel: {
    marginTop: 4,
    color: Palette.brown,
    fontSize: 13,
  },
  guessCount: {
    marginTop: 16,
    color: Palette.cream,
    fontSize: 16,
  },
  errorMessage: {
    marginTop: 12,
    color: Palette.cream,
    fontSize: 14,
  },
  successMessage: {
    marginTop: 24,
    color: Palette.cream,
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
    backgroundColor: Palette.cream,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  closeButtonText: {
    color: Palette.brown,
    fontSize: 28,
    lineHeight: 28,
  },
  gameOverTitle: {
    color: Palette.brown,
    fontSize: 28,
    fontWeight: "700",
  },
  winTitle: {
    color: Palette.green,
    fontSize: 28,
    fontWeight: "700",
  },
  gameOverMessage: {
    marginTop: 12,
    color: Palette.brown,
    fontSize: 16,
  },
  answerImage: {
    width: 96,
    height: 96,
    marginTop: 20,
    borderRadius: 48,
    backgroundColor: Palette.cream,
  },
  answerName: {
    marginTop: 16,
    color: Palette.brown,
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  answerDetails: {
    marginTop: 8,
    color: Palette.brown,
    fontSize: 16,
  },
  eventInformation: {
    marginTop: 16,
    color: Palette.brown,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  eventInformationTitle: {
    marginTop: 16,
    color: Palette.brown,
    fontSize: 14,
    fontWeight: "700",
  },
  playAgainButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Palette.brown,
  },
  playAgainButtonText: {
    color: Palette.cream,
    fontSize: 16,
    fontWeight: "600",
  },
  freePlayPrompt: {
    marginTop: 20,
    color: Palette.brown,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
