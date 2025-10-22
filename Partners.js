import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
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

    useEffect(() => {
        const loadUserId = async () => {
            const id = await AsyncStorage.getItem('userId');
            setCurrentUserId(id);
        };
        loadUserId();
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(`http://192.168.1.99:5000/api/users?exclude=${currentUserId}`);
                const data = await response.json();
                setUsers(data.users);
            } catch (err) {
                console.error(err);
            }
        };

        if (currentUserId) {
            fetchUsers();
        }
    }, [currentUserId]);

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
                            {/* Optional badge for unread notifications */}
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

                {/* Users List */}
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
                            >
                                <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>
                                    {user.username}
                                </Text>
                                <Text style={{ color: '#fff', marginTop: 4, fontSize: 14, marginBottom: 10 }}>
                                    {user.email}
                                </Text>

                                {/* Add Trader Button for each user */}
                                <TouchableOpacity
                                    style={{
                                        position: 'absolute',
                                        bottom: 10,
                                        right: 15, 
                                        backgroundColor: '#1E90FF',
                                        paddingVertical: 8,
                                        paddingHorizontal: 14,
                                        borderRadius: 10,
                                    }}
                                    onPress={() => console.log('Add Trader for', user.username)}
                                >
                                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                                        Add Trader
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