import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
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
    const [messagesDropdownVisible, setMessagesDropdownVisible] = useState(false);
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
                setUsers(data.users);
            } catch (err) {
                console.error('Error fetching users:', err);
            }
        };

        if (currentUserId) {
            fetchUsers();
        }
    }, [currentUserId]);

    useEffect(() => {
        if (currentUserId) {
            fetchNotifications();
        }
    }, [currentUserId]);

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

            await fetchNotifications();
        } catch (error) {
            console.error('Error handling notification:', error);
            alert('Failed to process notification.');
        }
    };

    const fetchTradeNotifications = async () => {
        if (!currentUserId) {
            console.warn('currentUserId is null, skipping fetch');
            return;
        }

        const url = `http://192.168.1.99:5000/api/trades/trades/${currentUserId}`;

        try {
            const res = await fetch(url);
            if (!res.ok) return setTradeNotifications([]);
            const data = await res.json();
            setTradeNotifications(data);
        } catch {
            setTradeNotifications([]);
        }
    };

    useEffect(() => {
        const loadUserData = async () => {
            let id = await AsyncStorage.getItem('userId');
            let username = await AsyncStorage.getItem('username');

            if (!id) return;
            id = id.replace(/"/g, '');
            setCurrentUserId(id);
            setCurrentUsername(username);
        };

        loadUserData();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.appWrapper}>
                <View style={styles.navbar}>
                    <Text style={styles.navTitle}>Trades</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Profile Icon */}
                        <TouchableOpacity style={{ marginRight: 20 }} onPress={() => console.log('Profile pressed')}>
                            <Ionicons name="person-circle-outline" size={28} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ marginRight: 20, position: 'relative' }}
                            onPress={() => {
                                if (!messagesDropdownVisible) fetchTradeNotifications();
                                setMessagesDropdownVisible(!messagesDropdownVisible);
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
                            {/* Red dot for unread notifications */}
                            {tradeNotifications.some(n => !n.isRead) && !messagesDropdownVisible && (
                                <View
                                    style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: 'red',
                                    }}
                                />
                            )}
                        </TouchableOpacity>

                        {/* Trade Notifications Dropdown */}
                        {messagesDropdownVisible && (
                            <View
                                style={{
                                    position: 'absolute',
                                    top: 50,
                                    right: 0,
                                    width: 280,
                                    maxHeight: 400,
                                    backgroundColor: '#1C1C3A',
                                    borderRadius: 12,
                                    padding: 10,
                                    shadowColor: '#000',
                                    shadowOpacity: 0.3,
                                    shadowRadius: 6,
                                    zIndex: 999,
                                }}
                            >
                                {tradeNotifications.length === 0 ? (
                                    <Text style={{ color: '#fff', textAlign: 'center', paddingVertical: 10 }}>
                                        No trade offers
                                    </Text>
                                ) : (
                                    tradeNotifications.map((notif, index) => (
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
                                                            await fetch(`http://192.168.1.99:5000/api/trades/${notif.tradeId}/accept`, { method: 'PUT' });
                                                            Alert.alert('Success', 'Trade accepted!');
                                                            fetchTradeNotifications();
                                                            setMessagesDropdownVisible(false); // optionally close dropdown
                                                            navigation.navigate('MessagesScreen'); // redirect to Messages page
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
                                                            await fetch(`http://192.168.1.99:5000/api/trades/${notif.tradeId}/reject`, { method: 'PUT' });
                                                            Alert.alert('Success', 'Trade rejected');
                                                            fetchTradeNotifications();
                                                        } catch (err) {
                                                            Alert.alert('Error', 'Failed to reject trade');
                                                        }
                                                    }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 12 }}>Reject</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))
                                )}
                            </View>
                        )}

                        {/* Notifications Icon */}
                        <TouchableOpacity
                            style={{ marginRight: 20, position: 'relative' }}
                            onPress={() => {
                                if (!dropdownVisible) fetchNotifications();
                                setDropdownVisible(!dropdownVisible);
                            }}
                        >
                            <Ionicons name="notifications-outline" size={26} color="#fff" />
                            {notifications.some(n => !n.isRead) && !dropdownVisible && (
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
                            <View style={{
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
                            }}>
                                {notifications.length === 0 ? (
                                    <Text style={{ color: '#fff', textAlign: 'center', paddingVertical: 10 }}>
                                        No notifications
                                    </Text>
                                ) : (
                                    notifications.map((notif, index) => (
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
                                                    style={{ backgroundColor: '#28A745', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 }}
                                                    onPress={(e) => { e.stopPropagation(); handleNotificationAction(notif._id, 'accept'); }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 12 }}>Accept</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={{ backgroundColor: '#DC3545', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 }}
                                                    onPress={(e) => { e.stopPropagation(); handleNotificationAction(notif._id, 'reject'); }}
                                                >
                                                    <Text style={{ color: '#fff', fontSize: 12 }}>Reject</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </TouchableOpacity>
                                    ))
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
                            <Text
                                style={[
                                    styles.menuText,
                                    currentRoute === 'Homepage' && styles.activeMenuText
                                ]}
                            >
                                Home
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, currentRoute === 'TradesScreen' && styles.activeMenuItem]}
                            onPress={() => navigation.navigate('TradesScreen')}
                        >
                            <Ionicons
                                name={currentRoute === 'TradesScreen' ? 'swap-horizontal' : 'swap-horizontal-outline'}
                                size={24}
                                color={currentRoute === 'TradesScreen' ? '#FFD700' : '#fff'}
                            />
                            <Text
                                style={[
                                    styles.menuText,
                                    currentRoute === 'TradesScreen' && styles.activeMenuText
                                ]}
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
                            <Text
                                style={[
                                    styles.menuText,
                                    currentRoute === 'Partners' && styles.activeMenuText
                                ]}
                            >
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
                            <Text
                                style={[
                                    styles.menuText,
                                    activeTab === 'items' && styles.activeMenuText
                                ]}
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
        paddingTop: 5
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
        backgroundColor: '#FF3B30'
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