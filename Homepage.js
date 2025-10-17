import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function Homepage() {
    const navigation = useNavigation();

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
                <TouchableOpacity style={styles.centerButton}>
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
});
