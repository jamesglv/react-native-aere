// FilterModal.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RangeSlider from 'react-native-range-slider-expo';
import Slider from '@react-native-community/slider';

const FilterModal = ({
  filterModalVisible,
  toggleFilterModal,
  minAge,
  maxAge,
  setMinAge,
  setMaxAge,
  maxDistance,
  setMaxDistance,
  selectedGenders,
  toggleGender,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={toggleFilterModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter by Age</Text>

          {/* Age Range Slider */}
          <RangeSlider
            min={18}
            max={60}
            fromValueOnChange={setMinAge}
            toValueOnChange={setMaxAge}
            initialFromValue={minAge}
            initialToValue={maxAge}
            styleSize="medium"
          />
          <View style={styles.ageLabelContainer}>
            <Text style={styles.ageLabel}>Min Age: {minAge}</Text>
            <Text style={styles.ageLabel}>Max Age: {maxAge}</Text>
          </View>

          <Text style={styles.modalTitle}>Filter by Distance</Text>
          {/* Distance Slider */}
          <Slider
            style={{ width: '90%', height: 60 }}
            minimumValue={1}
            maximumValue={500}
            value={maxDistance}
            onValueChange={setMaxDistance}
            minimumTrackTintColor="#007bff"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#007bff"
          />
          <View style={styles.distanceLabelContainer}>
            <Text style={styles.distanceLabel}>Max Distance: {Math.round(maxDistance)} km</Text>
          </View>

          {/* Gender Filter */}
          <Text style={styles.modalTitle}>Filter by Gender</Text>
          <View style={styles.checkboxContainer}>
            {['Male', 'Female', 'Non-Binary'].map(gender => (
              <TouchableOpacity key={gender} style={styles.checkbox} onPress={() => toggleGender(gender)}>
                <Ionicons
                  name={selectedGenders.includes(gender) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={selectedGenders.includes(gender) ? '#007bff' : '#ddd'}
                />
                <Text style={styles.checkboxLabel}>{gender}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity onPress={toggleFilterModal} style={styles.closeModalButton}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Styles specific to FilterModal
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { width: '100%', height: '70%', backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  ageLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginVertical: 10 },
  ageLabel: { fontSize: 16, fontWeight: 'bold' },
  distanceLabelContainer: { alignItems: 'center', marginVertical: 10 },
  distanceLabel: { fontSize: 16, fontWeight: 'bold' },
  checkboxContainer: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 20 },
  checkbox: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  checkboxLabel: { marginLeft: 10, fontSize: 18, color: '#333' },
  closeModalButton: { marginTop: 20 },
  closeModalText: { color: '#007bff', fontSize: 18 },
});

export default FilterModal;
