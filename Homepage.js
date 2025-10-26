import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Image, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Homepage() {
    const navigation = useNavigation();
    const route = useRoute();
    const currentRoute = route.name;
    const [modalVisible, setModalVisible] = useState(false);
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemImage, setItemImage] = useState(null);
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState('home');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [menuVisible, setMenuVisible] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [currentUsername, setCurrentUsername] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [tradeModalVisible, setTradeModalVisible] = useState(false);
    const [selectedTradeItem, setSelectedTradeItem] = useState(null);
    const [tradeTargetItem, setTradeTargetItem] = useState(null);
    const [messagesDropdownVisible, setMessagesDropdownVisible] = useState(false);
    const [tradeNotifications, setTradeNotifications] = useState([]);
    const [tradeDropdownVisible, setTradeDropdownVisible] = useState(false);

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert('Permission to access gallery is required!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setItemImage(result.assets[0].uri);
        }
    };

    const handlePostItem = async () => {
        if (!itemName || !itemDescription || !itemImage || !currentUserId) {
            alert('Please complete all fields before posting.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', itemName);
            formData.append('description', itemDescription);
            formData.append('owner', currentUserId);

            let uri = itemImage;
            if (Platform.OS === 'android' && uri.startsWith('content://')) {
                const fileExt = uri.split('.').pop();
                uri = uri + '.' + fileExt;
            }

            formData.append('image', {
                uri,
                name: 'item.jpg',
                type: 'image/jpeg',
            });

            const response = await fetch('http://192.168.1.99:5000/api/items/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert('Item Posted Successfully!');
                setItemName('');
                setItemDescription('');
                setItemImage(null);
                setModalVisible(false);

                setItems(prev => [data.item, ...prev]);
            } else {
                alert(data.error || 'Failed to post item.');
            }
        } catch (error) {
            console.error(error);
            alert('Error posting item.');
        }
    };

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
        const loadUserAndFetchItems = async () => {
            try {
                let id = await AsyncStorage.getItem('userId');
                if (!id) return;

                id = id.replace(/"/g, '');
                setCurrentUserId(id);

                const response = await fetch(`http://192.168.1.99:5000/api/items?userId=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                const data = await response.json();
                if (response.ok) {
                    setItems(data.items);
                } else {
                    return;
                }
            } catch (err) {
                console.error('Error fetching items:', err);
            }
        };

        loadUserAndFetchItems();

        const intervalId = setInterval(loadUserAndFetchItems, 5000);
        return () => clearInterval(intervalId);
    }, []);

    const handleEditSave = async () => {
        if (!editItem) return;

        try {
            const response = await fetch(`http://192.168.1.99:5000/api/items/${editItem._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editedName,
                    description: editedDescription,
                    userId: currentUserId
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const updated = items.map(i => (i._id === editItem._id ? data.item : i));
                setItems(updated);
                setEditModalVisible(false);
            } else {
                alert(data.error || 'Failed to update item');
            }
        } catch (err) {
            console.error(err);
            alert('Error connecting to server');
        }
    };

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

    useEffect(() => {
        if (currentUserId) fetchNotifications();
    }, [currentUserId]);

    const handleNotificationAction = async (notificationId, action) => {
        try {
            if (action === 'accept') {
                await fetch(`http://192.168.1.99:5000/api/notifications/${notificationId}/accept`, { method: 'PUT' });
                Alert.alert('Success', 'Trader request accepted!');
            } else if (action === 'reject') {
                await fetch(`http://192.168.1.99:5000/api/notifications/${notificationId}`, { method: 'DELETE' });
                Alert.alert('Success', 'Trader request rejected.');
            }
            fetchNotifications();
        } catch (err) {
            console.error('Error handling notification:', err);
            Alert.alert('Error', 'Failed to process notification.');
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
        if (tradeDropdownVisible) {
            setTradeNotifications(prev => prev.map(t => ({ ...t, isRead: true })));
        }
    }, [tradeDropdownVisible]);

    useEffect(() => {
        if (!currentUserId) return;

        fetchTradeNotifications();

        const intervalId = setInterval(() => {
            fetchTradeNotifications();
        }, 5000);

        return () => clearInterval(intervalId);
    }, [currentUserId]);

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
                    <Text style={styles.navTitle}>Home</Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Profile Icon */}
                        <TouchableOpacity style={{ marginRight: 20 }} onPress={() => console.log('Profile pressed')}>
                            <Ionicons name="person-circle-outline" size={28} color="#fff" />
                        </TouchableOpacity>

                        {/* 💬 Trade Offers Icon */}
                        <TouchableOpacity
                            style={{ marginRight: 20, position: 'relative' }}
                            onPress={() => {
                                setDropdownVisible(false);
                                if (!tradeDropdownVisible) fetchTradeNotifications();
                                setTradeDropdownVisible(!tradeDropdownVisible);
                            }}
                        >
                            <Ionicons name="chatbubble-outline" size={26} color="#fff" />
                            {tradeNotifications.some(t => !t.isRead) && !tradeDropdownVisible && (
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

                        {/* Trade Notifications Dropdown */}
                        {tradeDropdownVisible && (
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
                                                            setTradeDropdownVisible(false);

                                                            if (notif.sender && notif.sender._id) {
                                                                navigation.navigate('MessagesScreen', {
                                                                    selectedUser: {
                                                                        _id: notif.sender._id,
                                                                        username: notif.sender.username || 'Unknown User',
                                                                    },
                                                                });
                                                            } else {
                                                                Alert.alert('Error', 'Sender information missing');
                                                            }
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

                <ScrollView style={styles.scrollView}>
                    {items.length === 0 ? (
                        <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                            No items found.
                        </Text>
                    ) : (
                        items.map((item, index) => (
                            <View
                                key={index}
                                style={{
                                    backgroundColor: '#1C1C3A',
                                    borderRadius: 15,
                                    padding: 15,
                                    marginVertical: 10,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 3 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 6,
                                    elevation: 8,
                                }}
                            >
                                {item.image && (
                                    <Image
                                        source={{ uri: `http://192.168.1.99:5000${item.image}` }}
                                        style={{
                                            width: '100%',
                                            height: 200,
                                            borderRadius: 12,
                                            marginBottom: 12,
                                        }}
                                        resizeMode="cover"
                                    />
                                )}

                                <Text
                                    style={{
                                        color: '#aaa',
                                        fontSize: 12,
                                        marginBottom: 8,
                                        fontStyle: 'italic',
                                    }}
                                >
                                    Posted by - {item.owner === currentUserId || item.owner?._id === currentUserId ? 'You' : item.owner?.username || 'Unknown User'}
                                </Text>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 6,
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: '#6C63FF',
                                            fontSize: 18,
                                            fontWeight: 'bold',
                                            flex: 1,
                                        }}
                                    >
                                        {item.name}
                                    </Text>

                                    <TouchableOpacity onPress={() => setMenuVisible(menuVisible === index ? null : index)}>
                                        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
                                    </TouchableOpacity>

                                    {menuVisible === index && (
                                        <View
                                            style={{
                                                position: 'absolute',
                                                right: 5,
                                                top: 30,
                                                backgroundColor: '#2E2E50',
                                                borderRadius: 10,
                                                paddingVertical: 6,
                                                paddingHorizontal: 12,
                                                elevation: 6,
                                                zIndex: 999,
                                            }}
                                        >
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setEditItem(item);
                                                    setEditedName(item.name);
                                                    setEditedDescription(item.description);
                                                    setMenuVisible(null);
                                                    setEditModalVisible(true);
                                                }}
                                            >
                                                <Text style={{ color: '#fff', paddingVertical: 4 }}>Edit Post</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={async () => {
                                                    Alert.alert(
                                                        "Delete Post",
                                                        "Are you sure you want to delete this post?",
                                                        [
                                                            { text: "Cancel", style: "cancel" },
                                                            {
                                                                text: "Delete",
                                                                style: "destructive",
                                                                onPress: async () => {
                                                                    try {
                                                                        const response = await fetch(`http://192.168.1.99:5000/api/items/${item._id}`, {
                                                                            method: 'DELETE',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ userId: currentUserId }),
                                                                        });

                                                                        if (response.ok) {
                                                                            const updatedItems = items.filter(i => i._id !== item._id);
                                                                            setItems(updatedItems);
                                                                            alert("Post deleted successfully!");
                                                                        } else {
                                                                            const data = await response.json();
                                                                            alert(data.error || "Failed to delete post");
                                                                        }
                                                                    } catch (err) {
                                                                        console.error("Error deleting post:", err);
                                                                        alert("Unable to connect to server.");
                                                                    }

                                                                    setMenuVisible(null);
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={{ color: 'red', paddingVertical: 4 }}>Delete Post</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>

                                <Text
                                    style={{
                                        color: '#D8BFD8',
                                        fontSize: 14,
                                        marginBottom: 4,
                                    }}
                                >
                                    {item.description}
                                </Text>

                                <Text
                                    style={{
                                        color: '#aaa',
                                        fontSize: 12,
                                        fontStyle: 'italic',
                                        textAlign: 'left',
                                        marginBottom: 12,
                                    }}
                                >
                                    Posted on {new Date(item.createdAt).toLocaleDateString()} at{' '}
                                    {new Date(item.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: '#2E2E50',
                                            paddingVertical: 8,
                                            paddingHorizontal: 12,
                                            borderRadius: 10,
                                        }}
                                        onPress={async () => {
                                            if (!currentUserId) {
                                                alert('Please wait, loading user...');
                                                return;
                                            }

                                            try {
                                                const response = await fetch(`http://192.168.1.99:5000/api/items/${item._id}/star`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ userId: currentUserId }),
                                                });

                                                const data = await response.json();

                                                if (response.ok) {
                                                    const updatedItems = [...items];
                                                    updatedItems[index].stars = data.stars;
                                                    updatedItems[index].starred = data.starred;
                                                    setItems(updatedItems);
                                                } else {
                                                    alert(data.error || 'Failed to update star');
                                                }
                                            } catch (err) {
                                                alert('Unable to connect to server.');
                                            }
                                        }}
                                    >
                                        <Ionicons name="star" size={20} color="#FFD700" />
                                        <Text style={{ color: '#fff', marginLeft: 6 }}>{item.stars || 0}</Text>
                                    </TouchableOpacity>

                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: '#FFD700',
                                                paddingVertical: 10,
                                                paddingHorizontal: 16,
                                                borderRadius: 10,
                                                marginLeft: 10,
                                            }}
                                            onPress={() => console.log(`Trade Later pressed for ${item.name}`)}
                                        >
                                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Trade Later</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.offerTradeButton}
                                            onPress={() => {
                                                setTradeTargetItem(item);
                                                setTradeModalVisible(true);
                                            }}
                                        >
                                            <Text style={styles.tradeButtonText}>Offer Trade</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>

                <Modal
                    visible={tradeModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setTradeModalVisible(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalContent}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>
                                Select one of your items to trade for {tradeTargetItem?.name}
                            </Text>

                            <ScrollView style={{ width: '100%', maxHeight: 300 }}>
                                {items
                                    .filter(item => {
                                        const isMyItem = item.owner === currentUserId || item.owner?._id === currentUserId;
                                        const isNotTargetItem = item._id !== tradeTargetItem?._id;
                                        return isMyItem && isNotTargetItem;
                                    })
                                    .map((item, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={{
                                                backgroundColor: selectedTradeItem === item ? '#6C63FF' : '#2E2E50',
                                                padding: 12,
                                                borderRadius: 10,
                                                marginBottom: 10,
                                            }}
                                            onPress={() => setSelectedTradeItem(item)}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.name}</Text>
                                            <Text style={{ color: '#ccc' }}>{item.description}</Text>
                                        </TouchableOpacity>
                                    ))}

                                {items.filter(item => {
                                    const isMyItem = item.owner === currentUserId || item.owner?._id === currentUserId;
                                    const isNotTargetItem = item._id !== tradeTargetItem?._id;
                                    return isMyItem && isNotTargetItem;
                                }).length === 0 && (
                                    <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
                                        You don't have any items to trade
                                    </Text>
                                )}
                            </ScrollView>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#1E90FF',
                                    padding: 12,
                                    borderRadius: 10,
                                    marginTop: 10,
                                    width: '100%',
                                }}
                                onPress={async () => {
                                    if (!selectedTradeItem) return alert('Select an item to offer');

                                    try {
                                        const response = await fetch('http://192.168.1.99:5000/api/trades', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                offeredItemId: selectedTradeItem._id,
                                                targetItemId: tradeTargetItem._id,
                                                userId: currentUserId,
                                            }),
                                        });

                                        const data = await response.json();

                                        if (response.ok) {
                                            Alert.alert(
                                                'Trade Offer Sent!',
                                                'A message has been sent to the item owner.',
                                                [
                                                    {
                                                        text: 'View Messages',
                                                        onPress: () => {
                                                            setTradeModalVisible(false);
                                                            setSelectedTradeItem(null);

                                                            navigation.navigate('MessagesScreen', {
                                                                selectedUser: {
                                                                    _id: tradeTargetItem.owner._id || tradeTargetItem.owner,
                                                                    username: tradeTargetItem.owner.username || 'User'
                                                                }
                                                            });
                                                        }
                                                    },
                                                    {
                                                        text: 'OK',
                                                        onPress: () => {
                                                            setTradeModalVisible(false);
                                                            setSelectedTradeItem(null);
                                                        }
                                                    }
                                                ]
                                            );
                                        } else {
                                            alert(data.error || 'Failed to send trade');
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert('Error connecting to server.');
                                    }
                                }}
                            >
                                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Send Offer</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{ marginTop: 10 }}
                                onPress={() => setTradeModalVisible(false)}
                            >
                                <Text style={{ color: '#FFD700', textAlign: 'center' }}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

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
                            <Text
                                style={[
                                    styles.menuText,
                                    activeTab === 'trades' && styles.activeMenuText
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

            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Post a New Item</Text>

                        <TouchableOpacity
                            style={[styles.imagePicker, { justifyContent: 'center', alignItems: 'center', position: 'relative' }]}
                            onPress={pickImage}
                        >
                            {itemImage ? (
                                <Image
                                    source={{ uri: itemImage }}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 12,
                                        resizeMode: 'cover',
                                    }}
                                />
                            ) : (
                                <Ionicons name="image-outline" size={40} color="#aaa" />
                            )}

                            <Text
                                style={{
                                    position: 'absolute',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: 16,
                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                }}
                            >
                                {itemImage ? 'Change Image' : 'Upload Image'}
                            </Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.input}
                            placeholder="Item Name"
                            placeholderTextColor="#aaa"
                            value={itemName}
                            onChangeText={setItemName}
                        />

                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Description"
                            placeholderTextColor="#aaa"
                            multiline
                            value={itemDescription}
                            onChangeText={setItemDescription}
                        />

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.postButton} onPress={handlePostItem}>
                                <Text style={styles.buttonText}>Post Item</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={editModalVisible} transparent={true} animationType="slide">
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <View style={{
                        backgroundColor: '#1C1C3A',
                        padding: 20,
                        borderRadius: 12,
                        width: '85%'
                    }}>
                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                            Edit Post
                        </Text>

                        <TextInput
                            value={editedName}
                            onChangeText={setEditedName}
                            placeholder="Item name"
                            placeholderTextColor="#999"
                            style={{
                                backgroundColor: '#2E2E50',
                                color: '#fff',
                                borderRadius: 10,
                                padding: 10,
                                marginBottom: 10
                            }}
                        />

                        <TextInput
                            value={editedDescription}
                            onChangeText={setEditedDescription}
                            placeholder="Description"
                            placeholderTextColor="#999"
                            style={{
                                backgroundColor: '#2E2E50',
                                color: '#fff',
                                borderRadius: 10,
                                padding: 10,
                                marginBottom: 15
                            }}
                            multiline
                        />

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Text style={{ color: '#aaa', marginRight: 20 }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleEditSave}>
                                <Text style={{ color: '#6C63FF', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1C1C3A',
        padding: 20,
        borderRadius: 15,
        width: '85%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    imagePicker: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2E2E50',
        width: 260,
        height: 120,
        borderRadius: 10,
        marginBottom: 15,
    },
    imageText: {
        color: '#aaa',
        fontSize: 12,
        marginTop: 5,
    },
    previewImage: {
        width: 120,
        height: 120,
        borderRadius: 10,
    },
    input: {
        width: '100%',
        backgroundColor: '#2E2E50',
        borderRadius: 8,
        padding: 10,
        color: '#fff',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    postButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
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
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    offerTradeButton: {
        backgroundColor: '#1E90FF',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginLeft: 10,
    },
    tradeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});