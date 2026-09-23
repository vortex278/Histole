import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  EventCard,
  getAttributeColor,
  getEraStatus,
  getScaleStatus,
  getStateStatus,
  getTagStatus,
  getYearStatus,
} from "@/game/event-logic";
import { findEventByName, findEventSuggestions, getDailyTarget } from "@/game/event-repository";

export default function Index() {
  const targetEvent = getDailyTarget();
  const [guessText, setGuessText] = useState("");
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
  const [guesses, setGuesses] = useState<EventCard[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const maxGuesses = 15;
  const eventSuggestions = findEventSuggestions(guessText);
  const submitGuess = () => {
    setIsSuggestionVisible(false);

    if (guesses.length >= maxGuesses) {
      return;
    }

    const nextEvent = findEventByName(guessText);

    if (!nextEvent) {
      setErrorMessage("Choose an event from the mock event catalog.");
      return;
    }

    if (guesses.some((event) => event.eventId === nextEvent.eventId)) {
      setErrorMessage("Event has already been guessed.");
      return;
    }

    setGuesses((previousGuesses) => [
      nextEvent,
      ...previousGuesses,
    ]);

    setGuessText("");
    setErrorMessage("");
  };
  const selectSuggestion = (eventName: string) => {
    setGuessText(eventName);
    setIsSuggestionVisible(false);
    setErrorMessage("");
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Histole!</Text>
      <Text style={styles.guessCount}>
        Guesses: {guesses.length} / {maxGuesses}
      </Text>
      <View style={styles.inputSection}>
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
          onSubmitEditing={submitGuess}
          editable={guesses.length < maxGuesses}
        />
        {isSuggestionVisible && eventSuggestions.length > 0 && (
          <View style={styles.suggestionList}>
            {eventSuggestions.map((event) => (
              <Pressable
                key={event.eventId}
                style={styles.suggestion}
                onPress={() => selectSuggestion(event.name)}
              >
                <Text style={styles.suggestionText}>{event.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      {errorMessage.length > 0 && <Text style={styles.errorMessage}>{errorMessage}</Text>}
      <Pressable style={styles.button} onPress={submitGuess} disabled={guesses.length >= maxGuesses}>
        <Text style={styles.buttonText}>Submit Guess</Text>
      </Pressable>
      {guesses.map((eventCard) => (
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
            <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(getYearStatus(eventCard.year, targetEvent.year)) }]}>
              <Text style={styles.attributeValue}>{eventCard.year}</Text>
              <Text style={styles.attributeLabel}>Year</Text>
            </View>

            <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(getStateStatus(eventCard.state, targetEvent.state)) }]}>
              <Text style={styles.attributeValue}>{eventCard.state}</Text>
              <Text style={styles.attributeLabel}>State</Text>
            </View>

            <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(getEraStatus(eventCard.era, targetEvent.era)) }]}>
              <Text style={styles.attributeValue}>{eventCard.era}</Text>
              <Text style={styles.attributeLabel}>Era</Text>
            </View>

            <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(getScaleStatus(eventCard.scale, targetEvent.scale)) }]}>
              <Text style={styles.attributeValue}>{eventCard.scale}</Text>
              <Text style={styles.attributeLabel}>Scale</Text>
            </View>

            <View style={[styles.attributeCard, { backgroundColor: getAttributeColor(getTagStatus(eventCard.tag, targetEvent.tag)) }]}>
              <Text style={styles.attributeValue}>{eventCard.tag}</Text>
              <Text style={styles.attributeLabel}>Tag</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  attributeCard: {
    minWidth: 120,
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
});
