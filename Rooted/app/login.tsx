import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo + Title */}
      <View style={styles.header}>
        <Image
          source={require("../assets/logo.png")} // put logo.png in Rooted/assets
          style={styles.logo}
        />
        <Text style={styles.title}>ROOTED</Text>
        <Text style={styles.subtitle}>VOLUNTEER & COMMUNITY</Text>
      </View>

      {/* Username */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        placeholder="johndoe123@email.com"
        placeholderTextColor="#777"
        style={styles.input}
        autoCapitalize="none"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="************"
        placeholderTextColor="#777"
        secureTextEntry
        style={styles.input}
      />

      {/* Sign-In button → go to Home tab */}
<TouchableOpacity
  style={styles.signInButton}
  onPress={() => router.replace("/(tabs)/index"as any)}
>
  <Text style={styles.signInText}>Sign-In</Text>
</TouchableOpacity>

{/* Sign Up button → go to signup screen */}
<TouchableOpacity
  style={styles.signUpButton}
  onPress={() => router.push("/signup")}
>
  <Text style={styles.signUpText}>Sign Up</Text>
</TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9E6",
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#4D5B31",
  },
  subtitle: {
    fontSize: 12,
    color: "#4D5B31",
    letterSpacing: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    backgroundColor: "#E5E5E5",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 18,
    fontSize: 14,
  },
  signInButton: {
    width: "100%",
    backgroundColor: "#D9D9D9",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  signInText: {
    fontSize: 18,
    color: "black",
  },
  signUpButton: {
    width: "100%",
    backgroundColor: "#7A9E52",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 12,
  },
  signUpText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
});
