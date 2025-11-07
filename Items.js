import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function Items() {
  const navigation = useNavigation();
  const route = useRoute();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [allNotifications, setAllNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [currentRoute, setCurrentRoute] = useState(route.name);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchUserItems = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch(`http://192.168.1.99:5000/api/items?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        const userItems = data.items.filter(
          item =>
            item.owner === userId.replace(/"/g, '') || item.owner?._id === userId.replace(/"/g, ''),
        );
        setItems(userItems || []);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch items');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserItems();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appWrapper}>
        {/* Navbar */}
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>Items</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ marginRight: 20 }}
              onPress={() => navigation.navigate('ProfileScreen')}
            >
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginRight: 20, position: 'relative' }}
              onPress={() => setDropdownVisible(!dropdownVisible)}
            >
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              {hasUnreadNotifications && !dropdownVisible && (
                <View
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: -2,
                    backgroundColor: 'red',
                    borderRadius: 8,
                    width: 10,
                    height: 10,
                  }}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={async () => {
                try {
                  const response = await fetch('http://192.168.1.99:5000/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                  });
                  const data = await response.json();
                  if (response.ok) {
                    navigation.replace('LoginScreen');
                  } else {
                    Alert.alert('Error', data.error || 'Logout failed');
                  }
                } catch (err) {
                  console.error(err);
                  Alert.alert('Error', 'Unable to connect to server.');
                }
              }}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {items.length === 0 ? (
            <Text style={styles.noItemsText}>You haven't posted any items yet.</Text>
          ) : (
            items.map(item => (
              <View key={item._id} style={styles.itemCard}>
                {item.image && (
                  <Image
                    source={{ uri: `http://192.168.1.99:5000${item.image}` }}
                    style={styles.itemImage}
                  />
                )}
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <Text style={styles.itemDate}>
                  Posted on {new Date(item.createdAt).toLocaleDateString()} at{' '}
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={[styles.menuItem, currentRoute === 'Homepage' && styles.activeMenuItem]}
              onPress={() => navigation.navigate('Homepage')}
            >
              <Ionicons
                name={currentRoute === 'Homepage' ? 'home' : 'home-outline'}
                size={24}
                color={currentRoute === 'Homepage' ? '#FFD700' : '#fff'}
              />
              <Text style={[styles.menuText, currentRoute === 'Homepage' && styles.activeMenuText]}>
                Home
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, currentRoute === 'TradesScreen' && styles.activeMenuItem]}
              onPress={() => navigation.navigate('TradesScreen')}
            >
              <Ionicons
                name={
                  currentRoute === 'TradesScreen' ? 'swap-horizontal' : 'swap-horizontal-outline'
                }
                size={24}
                color={currentRoute === 'TradesScreen' ? '#FFD700' : '#fff'}
              />
              <Text
                style={[styles.menuText, currentRoute === 'TradesScreen' && styles.activeMenuText]}
              >
                Trades
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuGroup}>
            <TouchableOpacity
              style={[styles.menuItem, currentRoute === 'Partners' && styles.activeMenuItem]}
              onPress={() => navigation.navigate('Partners')}
            >
              <Ionicons
                name={currentRoute === 'Partners' ? 'people' : 'people-outline'}
                size={24}
                color={currentRoute === 'Partners' ? '#FFD700' : '#fff'}
              />
              <Text style={[styles.menuText, currentRoute === 'Partners' && styles.activeMenuText]}>
                Partners
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, currentRoute === 'ItemsScreen' && styles.activeMenuItem]}
              onPress={() => navigation.navigate('ItemsScreen')}
            >
              <Ionicons
                name={currentRoute === 'ItemsScreen' ? 'cube' : 'cube-outline'}
                size={24}
                color={currentRoute === 'ItemsScreen' ? '#FFD700' : '#fff'}
              />
              <Text
                style={[styles.menuText, currentRoute === 'ItemsScreen' && styles.activeMenuText]}
              >
                Items
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.centerButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appWrapper: {
    width: 360,
    flex: 1,
    maxHeight: 740,
    backgroundColor: '#0B0B1D',
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B1D',
  },
  navbar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#1C1C3A',
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E50',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noItemsText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  itemCard: {
    backgroundColor: '#1C1C3A',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  itemName: {
    color: '#6C63FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemDesc: {
    color: '#D8BFD8',
    fontSize: 14,
    marginBottom: 8,
  },
  itemDate: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C3A',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 70,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'relative',
  },
  menuGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  menuItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 2,
  },
  activeMenuItem: {
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
  },
  activeMenuText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});
