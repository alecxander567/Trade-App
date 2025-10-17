import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Image  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export default function Homepage() {
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [itemImage, setItemImage] = useState(null);

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
        if (!itemName || !itemDescription || !itemImage) {
            alert('Please complete all fields before posting.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('name', itemName);
            formData.append('description', itemDescription);

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
            } else {
                alert(data.error || 'Failed to post item.');
            }
        } catch (error) {
            console.error(error);
            alert('Error posting item.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Navbar */}
            <View style={styles.navbar}>
                <Text style={styles.navTitle}>Home</Text>
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
                                alert(data.message);
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

            <View style={styles.content}>
                <Text style={styles.title}>Hello</Text>
                <Text style={styles.subtitle}>Welcome to Homepage!</Text>
            </View>

            {/* Footer Menu */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="home-outline" size={24} color="#fff" />
                    <Text style={styles.menuText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="swap-horizontal-outline" size={24} color="#fff" />
                    <Text style={styles.menuText}>Trades</Text>
                </TouchableOpacity>

                {/* Center Plus Button */}
                <TouchableOpacity style={styles.centerButton} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="people-outline" size={24} color="#fff" />
                    <Text style={styles.menuText}>Partners</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                    <Ionicons name="cube-outline" size={24} color="#fff" />
                    <Text style={styles.menuText}>Items</Text>
                </TouchableOpacity>
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

                        {/* Image Picker */}
                        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                            {itemImage ? (
                                <Image source={{ uri: itemImage }} style={styles.previewImage} />
                            ) : (
                                <Ionicons name="image-outline" size={40} color="#aaa" />
                            )}
                            <Text style={styles.imageText}>
                                {itemImage ? 'Change Image' : 'Upload Image'}
                            </Text>
                        </TouchableOpacity>

                        {/* Name Input */}
                        <TextInput
                            style={styles.input}
                            placeholder="Item Name"
                            placeholderTextColor="#aaa"
                            value={itemName}
                            onChangeText={setItemName}
                        />

                        {/* Description Input */}
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Description"
                            placeholderTextColor="#aaa"
                            multiline
                            value={itemDescription}
                            onChangeText={setItemDescription}
                        />

                        {/* Buttons */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0B1D',
        justifyContent: 'space-between',
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
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 70,
        paddingHorizontal: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        position: 'relative',
    },
    menuItem: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
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
        top: -30,
        left: '45%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
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
});
