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
                    console.log(data.error || 'Failed to load items');
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

                    <TouchableOpacity style={{ marginRight: 20 }} onPress={() => console.log('Notifications pressed')}>
                        <Ionicons name="notifications-outline" size={26} color="#fff" />
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
                    </TouchableOpacity>

                    {/* Log Out Button */}
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
                                    alert(data.error || 'Logout failed');
                                }
                            } catch (err) {
                                console.error(err);
                                alert('Unable to connect to server.');
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
                                {/* Image */}
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

                                    {/* Popup Menu */}
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

                                {/* Description */}
                                <Text
                                    style={{
                                        color: '#D8BFD8',
                                        fontSize: 14,
                                        marginBottom: 4,
                                    }}
                                >
                                    {item.description}
                                </Text>

                                {/* Date */}
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

                                {/* Star + Trade Buttons */}
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
                                                console.error('Error toggling star:', err);
                                                alert('Unable to connect to server.');
                                            }
                                        }}
                                    >
                                        <Ionicons name="star" size={20} color="#FFD700" />
                                        <Text style={{ color: '#fff', marginLeft: 6 }}>{item.stars || 0}</Text>
                                    </TouchableOpacity>

                                    {/* Trade Buttons */}
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
                                            style={{
                                                backgroundColor: '#1E90FF',
                                                paddingVertical: 10,
                                                paddingHorizontal: 16,
                                                borderRadius: 10,
                                                marginLeft: 10,
                                            }}
                                            onPress={() => console.log(`Offer Trade pressed for ${item.name}`)}
                                        >
                                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Offer Trade</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
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


            {/* Modal */}
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

                            {/* Overlay Text */}
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

            {/* Edit Modal */}
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
});