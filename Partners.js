import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Partners() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;
  const [activeTab, setActiveTab] = useState('partners');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [tradeNotifications, setTradeNotifications] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('username');

      setCurrentUserId(id);
      setCurrentUsername(username);
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const response = await fetch(`http://192.168.1.99:5000/api/notifications/${currentUserId}`);

      const data = await response.json();

      setNotifications(data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://192.168.1.99:5000/api/users?exclude=${currentUserId}`);
        const data = await response.json();

        const updatedUsers = await Promise.all(
          data.users.map(async user => {
            const alreadyRequested = notifications.some(
              notif =>
                notif.senderId === currentUserId &&
                notif.receiverId === user._id &&
                notif.message.includes('wants to add you as a trader'),
            );

            const key = `request_sent_${currentUserId}_${user._id}`;
            const storedRequest = await AsyncStorage.getItem(key);

            return {
              ...user,
              requestSent: alreadyRequested || storedRequest === 'true',
            };
          }),
        );

        setUsers(updatedUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (currentUserId && notifications.length >= 0) {
      fetchUsers();
    }
  }, [currentUserId, notifications]);

  const handleNotificationAction = async (notificationId, action) => {
    try {
      if (action === 'accept') {
        await fetch(`http://192.168.1.99:5000/api/notifications/${notificationId}/accept`, {
          method: 'PUT',
        });

        alert('Trader request accepted!');
      } else if (action === 'reject') {
        await fetch(`http://192.168.1.99:5000/api/notifications/${notificationId}`, {
          method: 'DELETE',
        });

        alert('Trader request rejected.');
      }

      const notification = notifications.find(n => n._id === notificationId);
      if (notification) {
        const key = `request_sent_${notification.senderId}_${notification.receiverId}`;
        await AsyncStorage.removeItem(key);
      }

      await fetchNotifications();
    } catch (error) {
      console.error('Error handling notification:', error);
      alert('Failed to process notification.');
    }
  };

  const sendNotification = async (receiverId, receiverUsername) => {
    if (!currentUserId || !currentUsername) {
      Alert.alert('Error', 'User info not loaded yet. Please wait a moment.');
      return;
    }

    const notificationData = {
      senderId: currentUserId,
      receiverId: receiverId,
      message: `${currentUsername} wants to add you as a trader.`,
    };

    try {
      const res = await fetch('http://192.168.1.99:5000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      const data = await res.json();

      if (res.ok) {
        setUsers(prevUsers =>
          prevUsers.map(u => (u._id === receiverId ? { ...u, requestSent: true } : u)),
        );

        const key = `request_sent_${currentUserId}_${receiverId}`;
        await AsyncStorage.setItem(key, 'true');

        Alert.alert('Success', 'Trader request sent!');
      } else {
        Alert.alert('Error', data.error || 'Failed to send request.');
      }
    } catch (error) {
      console.error('Network error:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', 'Unable to connect to the server. Check console for details.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appWrapper}>
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>Partners</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Profile Icon */}
            <TouchableOpacity
              style={{ marginRight: 20 }}
              onPress={() => console.log('Profile pressed')}
            >
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Notifications Icon */}
            <TouchableOpacity
              style={{ marginRight: 20, position: 'relative' }}
              onPress={async () => {
                if (!dropdownVisible) {
                  await fetchNotifications();
                }
                setDropdownVisible(!dropdownVisible);
              }}
            >
              <Ionicons name="notifications-outline" size={26} color="#fff" />
              {(notifications.some(n => !n.isRead) || tradeNotifications.some(n => !n.isRead)) &&
                !dropdownVisible && (
                  <View
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: 2,
                      backgroundColor: 'red',
                      borderRadius: 8,
                      width: 10,
                      height: 10,
                    }}
                  />
                )}
            </TouchableOpacity>

            {/* Notifications Dropdown */}
            {dropdownVisible && (
              <View
                style={{
                  position: 'absolute',
                  top: 60,
                  right: 10,
                  backgroundColor: '#1C1C3A',
                  borderRadius: 12,
                  padding: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  width: 280,
                  maxHeight: 400,
                  zIndex: 999,
                }}
              >
                {notifications.length + tradeNotifications.length === 0 ? (
                  <Text style={{ color: '#fff', textAlign: 'center', paddingVertical: 10 }}>
                    No notifications
                  </Text>
                ) : (
                  <>
                    {notifications.map((notif, index) => (
                      <TouchableOpacity
                        key={notif._id || index}
                        activeOpacity={0.8}
                        style={{
                          backgroundColor: notif.isRead ? '#1E1E3A' : '#2E2E50',
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 10,
                          borderLeftWidth: 3,
                          borderLeftColor: notif.isRead ? '#444' : '#6C63FF',
                        }}
                        onPress={() => setDropdownVisible(false)}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>
                          {notif.message}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#28A745',
                              paddingVertical: 5,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                            }}
                            onPress={async e => {
                              e.stopPropagation();
                              await handleNotificationAction(notif._id, 'accept');

                              if (notif.sender && notif.sender._id) {
                                navigation.navigate('MessagesScreen', {
                                  selectedUser: {
                                    _id: notif.sender._id,
                                    username: notif.sender.username || 'Unknown User',
                                  },
                                });
                              } else {
                                Alert.alert('Error', 'Sender info missing.');
                              }
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 12 }}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#DC3545',
                              paddingVertical: 5,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                            }}
                            onPress={e => {
                              e.stopPropagation();
                              handleNotificationAction(notif._id, 'reject');
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 12 }}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {tradeNotifications.map((notif, index) => (
                      <View
                        key={notif._id || index}
                        style={{
                          backgroundColor: notif.isRead ? '#1E1E3A' : '#2E2E50',
                          borderRadius: 8,
                          padding: 10,
                          marginBottom: 10,
                          borderLeftWidth: 3,
                          borderLeftColor: notif.isRead ? '#444' : '#1E90FF',
                        }}
                      >
                        <Text style={{ color: '#fff', fontSize: 14, marginBottom: 8 }}>
                          {notif.message}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#28A745',
                              paddingVertical: 5,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                            }}
                            onPress={async () => {
                              try {
                                await fetch(
                                  `http://192.168.1.99:5000/api/trades/${notif.tradeId}/accept`,
                                  { method: 'PUT' },
                                );
                                Alert.alert('Success', 'Trade accepted!');
                                fetchNotifications();
                                setDropdownVisible(false);
                              } catch (err) {
                                Alert.alert('Error', 'Failed to accept trade');
                              }
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 12 }}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#DC3545',
                              paddingVertical: 5,
                              paddingHorizontal: 10,
                              borderRadius: 6,
                            }}
                            onPress={async () => {
                              try {
                                await fetch(
                                  `http://192.168.1.99:5000/api/trades/${notif.tradeId}/reject`,
                                  { method: 'PUT' },
                                );
                                Alert.alert('Success', 'Trade rejected');
                                fetchNotifications();
                              } catch (err) {
                                Alert.alert('Error', 'Failed to reject trade');
                              }
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 12 }}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}

            {/* Logout Button */}
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

        <ScrollView style={[styles.scrollView, { marginTop: 20 }]}>
          {users.length === 0 ? (
            <Text style={{ color: '#fff', textAlign: 'center', marginTop: 20 }}>
              No partners found.
            </Text>
          ) : (
            users.map(user => (
              <View
                key={user._id}
                style={{
                  backgroundColor: '#1C1C3A',
                  padding: 15,
                  paddingBottom: 50,
                  borderRadius: 8,
                  marginBottom: 10,
                  position: 'relative',
                }}
                pointerEvents="box-none"
              >
                <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>
                  {user.username}
                </Text>
                <Text style={{ color: '#fff', marginTop: 4, fontSize: 14, marginBottom: 10 }}>
                  {user.email}
                </Text>

                <TouchableOpacity
                  disabled={user.requestSent}
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 15,
                    backgroundColor: user.requestSent ? '#555' : '#1E90FF',
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    opacity: user.requestSent ? 0.6 : 1,
                  }}
                  onPress={() => sendNotification(user._id, user.username)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                    {user.requestSent ? 'Request Sent' : 'Add Trader'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

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
              style={[styles.menuItem, activeTab === 'trades' && styles.activeMenuItem]}
              onPress={() => {
                setActiveTab('trades');
                navigation.navigate('TradesScreen');
              }}
            >
              <Ionicons
                name={activeTab === 'trades' ? 'swap-horizontal' : 'swap-horizontal-outline'}
                size={24}
                color={activeTab === 'trades' ? '#FFD700' : '#fff'}
              />
              <Text style={[styles.menuText, activeTab === 'trades' && styles.activeMenuText]}>
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
              style={[styles.menuItem, activeTab === 'items' && styles.activeMenuItem]}
              onPress={() => {
                setActiveTab('items');
                navigation.navigate('ItemsScreen');
              }}
            >
              <Ionicons
                name={activeTab === 'items' ? 'cube' : 'cube-outline'}
                size={24}
                color={activeTab === 'items' ? '#FFD700' : '#fff'}
              />
              <Text style={[styles.menuText, activeTab === 'items' && styles.activeMenuText]}>
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
  scrollView: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 10,
    marginBottom: 15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#CFCFCF',
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
  navbar: {
    height: 60,
    backgroundColor: '#1C1C3A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2E50',
    paddingTop: 5,
  },
  navTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  activeMenuItem: {
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
  },
  activeMenuText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  addTraderButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
