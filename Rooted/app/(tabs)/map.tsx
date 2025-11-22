import MapView, { Marker, Callout } from "react-native-maps";
import { StyleSheet, View, Linking, Text } from "react-native";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface Opportunity {
  id: string;
  business: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description: string;
}

export default function MapPage() {
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
          };
        });

        setOpportunities(items);
      }
    );

    return () => unsub();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...center,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {opportunities.map((item) => (
          <Marker
            key={item.id}
            pinColor="forestgreen"
            coordinate={{
              latitude: item.location.latitude,
              longitude: item.location.longitude,
            }}
          >
            <Callout
              onPress={() => {
                const lat = item.location.latitude;
                const lng = item.location.longitude;

                const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                Linking.openURL(url);
              }}
            >
              <View style={{ padding: 10, maxWidth: 200 }}>
                <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
                  {item.business}
                </Text>
                <Text style={{  fontSize: 12 }}>
                  {item.description}
                </Text>

                <Text style={{ marginTop: 8, color: "blue" }}>
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
  container: { flex: 1 },
});
