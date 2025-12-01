import MapView, { Marker, Callout } from "react-native-maps";
import { StyleSheet, View, Linking, Text, Image, Platform } from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface Opportunity {
  id: string;
  business: string;
  location: { latitude: number; longitude: number };
  description: string;
  eventType?: "ongoing" | "upcoming";
}


export default function MapPage() {

  const openNativeDirections = (lat: number, lng: number) => {
  const label = "Volunteer Location";

  if (Platform.OS === "ios") {
    // Use Apple Maps HTTP link — works inside Expo Go
    const url = `http://maps.apple.com/?q=${encodeURIComponent(label)}&ll=${lat},${lng}`;
    Linking.openURL(url);
  } else {
    // Use native Android geo: scheme
    const url = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.openURL(url);
  }
};


  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const center = {
    latitude: 30.4515,
    longitude: -91.1871,
  };

  useEffect(() => {
    // Listen to Firestore changes in real-time
    const unsub = onSnapshot(
      collection(db, "VolunteerOpportunity"),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
  id: doc.id,
  business: data.Business,
  location: data.Location,
  description: data.Description,
  eventType: data.eventType ?? "ongoing",
};

        });

        setOpportunities(items);
      }
    );

    return () => unsub();
  }, []);

  return (
    
    <View style={styles.container}>
      <View style={styles.legendContainer}>
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, styles.ongoingMarker]} />
    <Text style={styles.legendLabel}>Ongoing</Text>
  </View>

  <View style={styles.legendItem}>
    <View style={[styles.legendDot, styles.upcomingMarker]} />
    <Text style={styles.legendLabel}>Upcoming</Text>
  </View>
</View>

      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...center,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {opportunities
  .filter((item) => item.location && item.location.latitude && item.location.longitude)
  .map((item) => (
    <Marker
      key={item.id}
      coordinate={{
        latitude: item.location.latitude,
        longitude: item.location.longitude,
      }}
    >

            <View style={[
  styles.markerDot,
  item.eventType === "upcoming"
    ? styles.upcomingMarker
    : styles.ongoingMarker
]}/>

            <Callout
              tooltip={true}
              onPress={() => openNativeDirections(item.location.latitude, item.location.longitude)}
            >
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>
                  {item.business}
                </Text>
                <Text style={styles.calloutDescription}>
                  {item.description}
                </Text>
                <Text style={styles.calloutDirections}>
                  Get Directions →
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  markerContainer: {
    backgroundColor: "#fcfaf0",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#333",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerImage: {
    width: 30,
    height: 30,
  },
  calloutContainer: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    width: 260,
    minHeight: 80,
    maxHeight: 400,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    color: "#000",
    lineHeight: 20,
  },
  calloutDescription: {
    fontSize: 13,
    marginBottom: 8,
    color: "#333",
    lineHeight: 18,
  },
  calloutDirections: {
    color: "#4d7c0f",
    fontWeight: "600",
    fontSize: 14,
    marginTop: 4,
  },
  markerDot: {
  width: 24,
  height: 24,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "#ffffff",
},

ongoingMarker: {
  backgroundColor: "#4d7c0f", // darkGreen
},

upcomingMarker: {
  backgroundColor: "#e8dcc8", // lightGreen
},
legendContainer: {
  position: "absolute",
  top: 50,
  left: 20,
  zIndex: 10,
  backgroundColor: "white",
  padding: 10,
  borderRadius: 8,
  elevation: 3,
  flexDirection: "row",
  gap: 14,
},

legendItem: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
},

legendDot: {
  width: 14,
  height: 14,
  borderRadius: 7,
  borderWidth: 1,
  borderColor: "#ccc",
},

legendLabel: {
  fontSize: 13,
  color: "#333",
  fontWeight: "600",
},

});