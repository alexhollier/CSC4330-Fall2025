// app/signup.tsx
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, Href } from "expo-router";

export default function Signup() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Logo + Title */}
      <View style={styles.header}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>ROOTED</Text>
        <Text style={styles.subtitle}>VOLUNTEER & COMMUNITY</Text>
      </View>

      {/* Full Name */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        placeholder="John Doe"
        placeholderTextColor="#777"
        style={styles.input}
        autoCapitalize="words"
      />

      {/* Email */}
      <Text style={styles.label}>Email</Text>
      <TextInput
        placeholder="johndoe123@email.com"
        placeholderTextColor="#777"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Password */}
      <Text style={styles.label}>Password</Text>
      <TextInput
        placeholder="************"
        placeholderTextColor="#777"
        secureTextEntry
        style={styles.input}
      />

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        placeholder="************"
        placeholderTextColor="#777"
        secureTextEntry
        style={styles.input}
      />

      {/* Create Account button → go to Home tabs for now */}
      <TouchableOpacity
        style={styles.createAccountButton}
        onPress={() => router.replace("/(tabs)/index" as Href)}
      >
        <Text style={styles.createAccountText}>Create Account</Text>
      </TouchableOpacity>

      {/* Already have an account? Back to Login */}
      <TouchableOpacity
        style={styles.backToLoginContainer}
        onPress={() => router.replace("/login")}
      >
        <Text style={styles.backToLoginText}>
          Already have an account?{" "}
          <Text style={styles.backToLoginLink}>Sign In</Text>
        </Text>
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
    marginBottom: 30,
  },
  logo: {
    width: 90,
    height: 90,
    resizeMode: "contain",
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
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
    marginBottom: 16,
    fontSize: 14,
  },
  createAccountButton: {
    width: "100%",
    backgroundColor: "#7A9E52",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  createAccountText: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  backToLoginContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  backToLoginText: {
    fontSize: 14,
    color: "#333",
  },
  backToLoginLink: {
    fontWeight: "600",
    color: "#4D5B31",
  },
});
