import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RangeSlider from 'react-native-range-slider-expo';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { getAuth } from 'firebase/auth';
import { updateUserDocument } from '../firebaseActions';

const FIREBASE_AUTH = getAuth();

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
  setSelectedGenders,
  currentUserId,
}) => {
  const toggleGender = async (gender) => {
    let updatedGenders = selectedGenders.includes(gender)
      ? selectedGenders.filter((g) => g !== gender)
      : [...selectedGenders, gender];
    
    setSelectedGenders(updatedGenders);

    const user = FIREBASE_AUTH.currentUser;
    if (user && user.uid === currentUserId) {
      try {
        await updateUserDocument({ interested: updatedGenders });
        console.log("User's interested field updated successfully");
      } catch (error) {
        console.error("Failed to update interested field:", error);
        Alert.alert("Error", "Failed to update gender preferences.");
      }
    } else {
      console.error("User is not authenticated.");
      Alert.alert("Error", "User is not authenticated.");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={toggleFilterModal}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={toggleFilterModal}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.7)']}
          style={styles.gradientOverlay}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle} className='font-oregular'>Age</Text>
              <MultiSlider
                values={[minAge, maxAge]}
                onValuesChange={(values) => {
                  setMinAge(values[0]);
                  setMaxAge(values[1]);
                }}
                min={18}
                max={60}
                step={1}
                selectedStyle={{ backgroundColor: 'black' }}
                unselectedStyle={{ backgroundColor: '#ddd' }}
                sliderLength={350}
                markerStyle={{
                  backgroundColor: 'black',
                  borderColor: 'black',
                  height: 30,
                  width: 30,
                }}
                containerStyle={{
                  height: 50,
                  width: '90%',
                }}
                trackStyle={{
                  height: 4,
                }}
              />

              <View style={styles.ageLabelContainer}>
                <Text style={styles.ageLabel} className='font-oregular'>{minAge}</Text>
                <Text style={styles.ageLabel} className='font-oregular'>{maxAge}</Text>
              </View>

              <Text style={styles.modalTitle} className='font-oregular'>Distance</Text>
              <Slider
                style={{ width: '90%', height: 60 }}
                minimumValue={1}
                maximumValue={500}
                value={maxDistance}
                onValueChange={setMaxDistance}
                minimumTrackTintColor="black"
                maximumTrackTintColor="#ddd"
                thumbTintColor="black"
              />
              <View style={styles.distanceLabelContainer}>
                <Text style={styles.distanceLabel} className='font-oregular'>Max Distance: {Math.round(maxDistance)} km</Text>
              </View>

              <Text style={styles.modalTitle} className='font-oregular'>Gender</Text>
              <View style={styles.checkboxContainer}>
                {['Male', 'Female', 'Non-Binary'].map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={styles.checkbox}
                    onPress={() => toggleGender(gender)}
                  >
                    <Ionicons
                      name={selectedGenders.includes(gender) ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={selectedGenders.includes(gender) ? 'black' : '#ddd'}
                    />
                    <Text style={styles.checkboxLabel} className='font-oregular'>{gender}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </LinearGradient>
      </TouchableOpacity>
    </Modal>
  );
};

// Styles specific to FilterModal
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  gradientOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    height: '70%',
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, marginBottom: 20, marginTop: 10 },
  ageLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
  },
  ageLabel: { fontSize: 20 },
  distanceLabelContainer: { alignItems: 'center', marginTop: 15, marginBottom: 50, },
  distanceLabel: { fontSize: 16, fontWeight: 'bold' },
  checkboxContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 20,
    width: '100%',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderColor: '#f0f0f0',
    borderWidth: 2,
    borderRadius: 25,
    marginBottom: 8,
  },
  checkboxLabel: { marginLeft: 10, fontSize: 18, color: '#333' },
});

export default FilterModal;
