import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
          console.log('No user ID found');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://192.168.1.99:5000/api/users/${userId}`);
        const data = await response.json();

        setUser(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        setUser(prev => ({ ...prev, profileImage: selectedImage }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const updateProfile = async () => {
    try {
      setUpdating(true);
      const userId = await AsyncStorage.getItem('userId');
      const formData = new FormData();

      if (user.profileImage && user.profileImage.startsWith('file://')) {
        formData.append('profileImage', {
          uri: user.profileImage,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
      }

      formData.append('email', user.email);

      const response = await fetch(`http://192.168.1.99:5000/api/users/${userId}`, {
        method: 'PUT',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      setUser(data.user);
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const updateProfileInfo = async () => {
    try {
      setUpdating(true);
      const userId = await AsyncStorage.getItem('userId');

      const response = await fetch(`http://192.168.1.99:5000/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          email: user.email,
        }),
      });

      const data = await response.json();
      setUser(prev => ({ ...prev, username: data.user.username, email: data.user.email }));
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={{ color: '#fff' }}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.wrapper}>
          <View style={styles.profileContainer}>
            {/* Profile Image */}
            <View style={{ position: 'relative' }}>
              <Image
                source={{
                  uri:
                    user.profileImage || 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Username */}
            {editing ? (
              <TextInput
                style={[styles.username, { borderBottomWidth: 1, borderBottomColor: '#6C63FF' }]}
                value={user.username}
                onChangeText={text => setUser(prev => ({ ...prev, username: text }))}
              />
            ) : (
              <Text style={styles.username}>{user.username}</Text>
            )}

            {/* Email Input */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Email:</Text>
              <TextInput
                style={[
                  styles.infoValue,
                  { color: '#fff', borderBottomWidth: 1, borderBottomColor: '#6C63FF' },
                ]}
                value={user.email}
                onChangeText={text => setUser(prev => ({ ...prev, email: text }))}
              />
            </View>

            {/* Partners & Items */}
            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Partners:</Text>
              <Text style={styles.infoValue}>{user.partners?.length || 0}</Text>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoLabel}>Items Posted:</Text>
              <Text style={styles.infoValue}>{user.itemsCount || 0}</Text>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={async () => {
                if (editing) {
                  await updateProfileInfo(); 
                  setEditing(false);
                } else {
                  setEditing(true); 
                }
              }}
              disabled={updating}
            >
              <Text style={styles.editButtonText}>{editing ? 'Save' : 'Update Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0B1D',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1C1C3A',
  },
  navTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  wrapper: {
    width: width,
    alignItems: 'center',
  },
  profileContainer: {
    width: '90%',
    backgroundColor: '#1C1C3A',
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  editIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#6C63FF',
    borderRadius: 20,
    padding: 6,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  infoContainer: {
    width: '85%',
    backgroundColor: '#0B0B1D',
    padding: 15,
    borderRadius: 12,
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 13,
    color: '#6C63FF',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 15,
    color: '#fff',
    marginTop: 3,
  },
  editButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 20,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
