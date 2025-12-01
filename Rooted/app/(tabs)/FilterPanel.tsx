import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FilterPanelProps {
  isVisible: boolean;
  onClose: () => void;
  onApplyFilters: (distance: number, morning: boolean, afternoon: boolean) => void;
  initialDistance?: number;
  initialMorning?: boolean;
  initialAfternoon?: boolean;
}

export default function FilterPanel({
  isVisible,
  onClose,
  onApplyFilters,
  initialDistance = 10,
  initialMorning = true,
  initialAfternoon = false,
}: FilterPanelProps) {
  const [distance, setDistance] = useState<number>(initialDistance);
  const [isMorningSelected, setIsMorningSelected] = useState<boolean>(initialMorning);
  const [isAfternoonSelected, setIsAfternoonSelected] = useState<boolean>(initialAfternoon);

  // Initialize state from incoming props when panel opens or when initial props change
  useEffect(() => {
    if (isVisible) {
      setDistance(initialDistance ?? 10);
      setIsMorningSelected(initialMorning ?? true);
      setIsAfternoonSelected(initialAfternoon ?? false);
    }
  }, [isVisible, initialDistance, initialMorning, initialAfternoon]);

  if (!isVisible) {
    return null;
  }

  const handleApply = () => {
    onApplyFilters(distance, isMorningSelected, isAfternoonSelected);
    onClose();
  };

  const Checkbox = ({ label, isChecked, onPress }: { label: string, isChecked: boolean, onPress: () => void }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
        {isChecked && <Ionicons name="checkmark-sharp" size={16} color="white" />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.panelOverlay}>
      <View style={styles.panelContent}>
        
        <Text style={styles.filterTitle}>Distance:</Text>
        <View style={styles.sliderRow}>
            <Text style={styles.distanceValue}>{distance} mi</Text>
            <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={50}
                step={1}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor="#85B35C" 
                maximumTrackTintColor="#ccc"
            />
        </View>
        <View style={styles.distanceLabels}>
            <Text style={styles.labelMin}>0</Text>
            <Text style={styles.labelMax}>50</Text>
        </View>

        {/* Time Filters */}
        <View style={styles.separator} />
        
        <Checkbox
          label="Morning"
          isChecked={isMorningSelected}
          onPress={() => setIsMorningSelected(!isMorningSelected)}
        />
        
        <Checkbox
          label="Afternoon"
          isChecked={isAfternoonSelected}
          onPress={() => setIsAfternoonSelected(!isAfternoonSelected)}
        />

        

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelOverlay: {
    position: 'absolute',
    top: 50, 
    right: 20,
    zIndex: 20, 
  },
  panelContent: {
    width: 200, 
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  slider: {
    flex: 1, 
    height: 30,
  },
  distanceValue: {
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 14,
    width: 30, 
    textAlign: 'center',
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  labelMin: {
      fontSize: 12,
  },
  labelMax: {
      fontSize: 12,
  },


  separator: {
      height: 1,
      backgroundColor: '#eee',
      marginVertical: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A8D387', 
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#85B35C', 
    borderColor: '#85B35C',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
});