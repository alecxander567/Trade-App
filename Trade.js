import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Trade() {
  const navigation = useNavigation();
  const route = useRoute();
  const currentRoute = route.name;
  const [activeTab, setActiveTab] = useState('TradesScreen');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [tradeNotifications, setTradeNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      const id = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('username');

      setCurrentUserId(id);
      setCurrentUsername(username);
    };
    loadUserData();
  }, []);

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`http://192.168.1.99:5000/api/notifications/${currentUserId}`);
      const data = await res.json();

      const friendRequests = data.filter(notif => notif.type === 'friend_request');
      setNotifications(friendRequests);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const fetchTradeNotifications = async () => {
    if (!currentUserId) return;

    try {
      const res = await fetch(`http://192.168.1.99:5000/api/trades/trades/${currentUserId}`);
      if (!res.ok) return setTradeNotifications([]);
      const data = await res.json();

      setTradeNotifications([...data]);
    } catch {
      setTradeNotifications([]);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
      fetchTradeNotifications();
    }
  }, [currentUserId]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://192.168.1.99:5000/api/users?exclude=${currentUserId}`);
        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  const fetchConversations = async () => {
    if (!currentUserId) return;

    try {
      const cleanId = currentUserId.replace(/"/g, '');

      const response = await fetch(
        `http://192.168.1.99:5000/api/messages/conversations/${cleanId}`,
      );
      const data = await response.json();

      setConversations(data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchConversations();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;

    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchTradeNotifications();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [currentUserId]);

  useEffect(() => {
    if (dropdownVisible) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setTradeNotifications(prev => prev.map(t => ({ ...t, isRead: true })));
    }
  }, [dropdownVisible]);

  const handleNotificationAction = async (notificationId, action) => {
    try {
      if (action === 'accept') {
        await fetch(`http://192.168.1.99:5000/api/notifications/${notificationId}/accept`, {
          method: 'PUT',
        });
        Alert.alert('Success', 'Trader request accepted!');
      } else if (action === 'reject') {
        await fetch(`http://192.168.1.99:5000/api/notifications/${notificationId}`, {
          method: 'DELETE',
        });
        Alert.alert('Success', 'Trader request rejected.');
      }
      fetchNotifications();
    } catch (err) {
      console.error('Error handling notification:', err);
      Alert.alert('Error', 'Failed to process notification.');
    }
  };

  const allNotifications = [
    ...notifications.map(n => ({ ...n, notifType: 'friend_request' })),
    ...tradeNotifications.map(t => ({ ...t, notifType: 'trade_offer' })),
  ];

  const hasUnreadNotifications = allNotifications.some(n => !n.isRead);

  const formatTime = timestamp => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const renderConversationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => {
        navigation.navigate('MessagesScreen', {
          selectedUser: {
            _id: item.otherUser._id,
            username: item.otherUser.username,
          },
        });
      }}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle" size={50} color="#6C63FF" />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.otherUser.username}</Text>
          <Text style={styles.conversationTime}>{formatTime(item.lastMessage.createdAt)}</Text>
        </View>
        <Text
          style={[styles.conversationMessage, item.unreadCount > 0 && styles.unreadMessage]}
          numberOfLines={1}
        >
          {item.lastMessage.sender === currentUserId ? 'You: ' : ''}
          {item.lastMessage.text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appWrapper}>
        <View style={styles.navbar}>
          <Text style={styles.navTitle}>Trades</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Profile Icon */}
            <TouchableOpacity
              style={{ marginRight: 20 }}
              onPress={() => console.log('Profile pressed')}
            >
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Unified Notifications Icon */}
            <TouchableOpacity
              style={{ marginRight: 20, position: 'relative' }}
              onPress={() => {
                if (!dropdownVisible) {
                  fetchNotifications();
                  fetchTradeNotifications();
                }
                setDropdownVisible(!dropdownVisible);
              }}
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

            {/* Unified Notifications Dropdown */}
            {dropdownVisible && (
              <View style={styles.dropdown}>
                <ScrollView>
                  {allNotifications.length === 0 ? (
                    <Text style={styles.emptyText}>No notifications</Text>
                  ) : (
                    allNotifications.map((notif, index) => (
                      <View
                        key={notif._id || index}
                        style={[
                          styles.notificationCard,
                          {
                            backgroundColor: notif.isRead ? '#1E1E3A' : '#2E2E50',
                            borderLeftColor: notif.isRead
                              ? '#444'
                              : notif.notifType === 'trade_offer'
                                ? '#1E90FF'
                                : '#6C63FF',
                          },
                        ]}
                      >
                        <Text style={styles.notificationMessage}>{notif.message}</Text>
                        <View style={styles.notificationActions}>
                          {notif.notifType === 'friend_request' && (
                            <>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.acceptButton]}
                                onPress={() => handleNotificationAction(notif._id, 'accept')}
                              >
                                <Text style={styles.actionButtonText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleNotificationAction(notif._id, 'reject')}
                              >
                                <Text style={styles.actionButtonText}>Reject</Text>
                              </TouchableOpacity>
                            </>
                          )}
                          {notif.notifType === 'trade_offer' && (
                            <>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.acceptButton]}
                                onPress={async () => {
                                  try {
                                    await fetch(
                                      `http://192.168.1.99:5000/api/trades/${notif.tradeId}/accept`,
                                      { method: 'PUT' },
                                    );
                                    Alert.alert('Success', 'Trade accepted!');
                                    fetchTradeNotifications();
                                    setDropdownVisible(false);

                                    if (notif.sender && notif.sender._id) {
                                      navigation.navigate('MessagesScreen', {
                                        selectedUser: {
                                          _id: notif.sender._id,
                                          username: notif.sender.username || 'Unknown User',
                                        },
                                      });
                                    } else {
                                      Alert.alert('Error', 'Unable to open chat');
                                    }
                                  } catch (err) {
                                    Alert.alert('Error', 'Failed to accept trade');
                                  }
                                }}
                              >
                                <Text style={styles.actionButtonText}>Accept</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={async () => {
                                  try {
                                    await fetch(
                                      `http://192.168.1.99:5000/api/trades/${notif.tradeId}/reject`,
                                      { method: 'PUT' },
                                    );
                                    Alert.alert('Success', 'Trade rejected');
                                    fetchTradeNotifications();
                                  } catch (err) {
                                    Alert.alert('Error', 'Failed to reject trade');
                                  }
                                }}
                              >
                                <Text style={styles.actionButtonText}>Reject</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
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

        {/* Inbox Content */}
        <View style={styles.inboxContainer}>
          {conversations.length === 0 ? (
            <View style={styles.emptyInbox}>
              <Ionicons name="chatbubbles-outline" size={80} color="#444" />
              <Text style={styles.emptyInboxText}>No messages yet</Text>
              <Text style={styles.emptyInboxSubtext}>
                Start a conversation by accepting a trade offer
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={item => item.otherUser._id}
              renderItem={renderConversationItem}
              contentContainerStyle={styles.conversationList}
            />
          )}
        </View>

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
  inboxContainer: {
    flex: 1,
    backgroundColor: '#0B0B1D',
  },
  emptyInbox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyInboxText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyInboxSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  conversationList: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#1C1C3A',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  conversationName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationTime: {
    color: '#888',
    fontSize: 12,
  },
  conversationMessage: {
    color: '#888',
    fontSize: 14,
  },
  unreadMessage: {
    color: '#fff',
    fontWeight: '600',
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
  dropdown: {
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
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 10,
  },
  notificationCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  notificationMessage: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  acceptButton: {
    backgroundColor: '#28A745',
  },
  rejectButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
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
  activeMenuItem: {
    borderTopWidth: 2,
    borderTopColor: '#FFD700',
  },
  activeMenuText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
});
