import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

type EventCard = {
  name: string,
  image: string,
  year: string,
  state: string,
  era: string,
  scale: string,
  tag: string,
}

export default function Index() {
  const [guessText, setGuessText] = useState("");
  const [guesses , setGuesses] = useState<EventCard[]>([]);
  <Text style={{ color: "white" }}>
    First guess: {guesses[0]?.name}
  </Text>
  const maxGuesses = 15;
  const submitGuess = () => {
    if (guesses.length >= maxGuesses) {
      return;
    }

    const cleanedGuess = guessText.trim();

    if (cleanedGuess.length === 0) {
      return;
    }

    const nextEvent: EventCard = {
      name: cleanedGuess,
      image: "https://private-user-images.githubusercontent.com/150096803/654976256-3981c67b-b649-49db-8212-0c4f36e99675.jpg?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3ODk5MTk5MDksIm5iZiI6MTc4OTkxOTYwOSwicGF0aCI6Ii8xNTAwOTY4MDMvNjU0OTc2MjU2LTM5ODFjNjdiLWI2NDktNDlkYi04MjEyLTBjNGYzNmU5OTY3NS5qcGc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjYwOTIwJTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI2MDkyMFQxNTUzMjlaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1hNzQ1NDQxZWUzNzI4NTJiMTEyMjA2OWIyMGQ4MGJmZjQxZjUxNmU1ODRiMjZiOTM5YTI2MzMwYTI1MTk2NWQ4JlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCZyZXNwb25zZS1jb250ZW50LXR5cGU9aW1hZ2UlMkZqcGVnIn0.LUSqCYTwp-QBGR_dF5Qb97vgXziBboKXUKJkJBC-KW0",
      year: "2023",
      era: "Modern",
      state: "California",
      scale: "National",
      tag: "Politics",
    };

    console.log("Submitted guess:", cleanedGuess);

    setGuesses((previousGuesses) => [
      nextEvent,
      ...previousGuesses,
    ]);

    setGuessText("");
  };
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Histole!</Text>
      <Text style={styles.guessCount}>
        Guesses: {guesses.length} / {maxGuesses}
      </Text>
      <TextInput
        style={styles.input}
        value={guessText}
        onChangeText={setGuessText}
        placeholder="Enter your guess"
        placeholderTextColor="#8f9498"
        returnKeyType="done"
        onSubmitEditing={submitGuess}
        editable={guesses.length < maxGuesses}
      />
      <Pressable style={styles.button} onPress={submitGuess} disabled={guesses.length >= maxGuesses}>
        <Text style={styles.buttonText}>Submit Guess</Text>
      </Pressable>
      {guesses.map((eventCard, index) => (
        <View style={styles.gameCard} key={eventCard.name}>
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
            <View style={styles.attributeCard}>
              <Text style={styles.attributeValue}>{eventCard.year}</Text>
              <Text style={styles.attributeLabel}>Year</Text>
            </View>

            <View style={styles.attributeCard}>
              <Text style={styles.attributeValue}>{eventCard.state}</Text>
              <Text style={styles.attributeLabel}>State</Text>
            </View>

            <View style={styles.attributeCard}>
              <Text style={styles.attributeValue}>{eventCard.era}</Text>
              <Text style={styles.attributeLabel}>Era</Text>
            </View>

            <View style={styles.attributeCard}>
              <Text style={styles.attributeValue}>{eventCard.scale}</Text>
              <Text style={styles.attributeLabel}>Scale</Text>
            </View>

            <View style={styles.attributeCard}>
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
  input: {
    width: "90%",
    maxWidth: 480,
    marginTop: 32,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f0f0f3",
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
  }
});
