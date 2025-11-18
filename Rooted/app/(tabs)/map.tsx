import MapView, { Marker } from "react-native-maps";
import { StyleSheet, View } from "react-native";

export default function MapPage() {
  const center = {
    latitude: 30.4515,
    longitude: -91.1871,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...center,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
