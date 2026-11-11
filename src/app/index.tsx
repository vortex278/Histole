import { Href, Link } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Palette } from "@/constants/theme";

export default function Index() {
  const { width } = useWindowDimensions();
  const vineWidth = Math.max(width * 1.08, 360);

  return (
    <LinearGradient
      colors={[Palette.brownLight, Palette.brown]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View pointerEvents="none" style={styles.vineRow}>
        <Image
          source={require("../../assets/images/histole-ivy.png")}
          style={{ width: vineWidth, aspectRatio: 1600 / 580 }}
          contentFit="contain"
        />
      </View>
      <View style={styles.logoFrame}>
        <Image source={require("../../assets/images/histole-logo.png")} style={styles.logo} contentFit="contain" />
      </View>
      <Text style={styles.subtitle}>Choose how you want to play.</Text>
      <Link href={"/daily" as Href} style={styles.modeLink}>
        <Text style={styles.modeTitle}>Daily Game</Text>
        <Text style={styles.modeDescription}>Play today&apos;s challenge.</Text>
      </Link>
      <Link href={"/free" as Href} style={styles.modeLink}>
        <Text style={styles.modeTitle}>Free Play</Text>
        <Text style={styles.modeDescription}>Keep playing with a new target each round.</Text>
      </Link>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 24,
  },
  vineRow: {
    position: "absolute",
    top: "42%",
    left: 0,
    width: "100%",
    alignItems: "center",
    zIndex: 1,
  },
  logoFrame: {
    width: 240,
    height: 240,
    borderRadius: 20,
    backgroundColor: Palette.cream,
    zIndex: 2,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  subtitle: {
    color: Palette.cream,
    fontSize: 17,
    textAlign: "center",
  },
  modeLink: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderRadius: 12,
    backgroundColor: Palette.cream,
  },
  modeTitle: {
    color: Palette.brown,
    fontSize: 21,
    fontWeight: "700",
  },
  modeDescription: {
    marginLeft: 10,
    color: Palette.brown,
    fontSize: 15,
  },
});
