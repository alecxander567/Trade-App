import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, StatusBar, Modal, TextInput, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Landingpage() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [signUpModalVisible, setSignUpModalVisible] = useState(false);
    const [loginModalVisible, setLoginModalVisible] = useState(false);
    const [hidePassword, setHidePassword] = useState(true);

    const handleSignUp = async () => {
        if (!username || !email || !password) {
            alert("Please fill all fields");
            return;
        }
        try {
            const response = await fetch('http://192.168.1.99:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                alert('User registered successfully!');
                setSignUpModalVisible(false);
                setUsername('');
                setEmail('');
                setPassword('');
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (err) {
            console.error(err);
            alert('Unable to connect to server.');
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            alert("Please fill all fields");
            return;
        }
        try {
            const response = await fetch('http://192.168.1.99:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Welcome back, ${data.user.username}!`);
                setLoginModalVisible(false);
                setEmail('');
                setPassword('');
                navigation.replace('Homepage');
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (err) {
            console.error(err);
            alert('Unable to connect to server.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <StatusBar barStyle="light-content" />

                {/* Navbar */}
                <View style={styles.navbar}>
                    <Text style={styles.navTitle}>TradeSmart</Text>
                    <View style={styles.navButtons}>
                        <TouchableOpacity style={styles.navButton} onPress={() => setLoginModalVisible(true)}>
                            <Text style={styles.navButtonText}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.navButton, styles.signUpButton]} onPress={() => setSignUpModalVisible(true)}>
                            <Text style={[styles.navButtonText, styles.signUpButtonText]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Hero Section */}
                <View style={styles.hero}>
                    <Image
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png' }}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>TradeSmart</Text>
                    <Text style={styles.subtitle}>Your Gateway to Smarter Trading</Text>
                    <TouchableOpacity style={styles.ctaButton} onPress={() => setLoginModalVisible(true)}>
                        <Text style={styles.ctaText}>Get Started</Text>
                    </TouchableOpacity>
                </View>

                {/* Features Section */}
                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Why Choose TradeSmart?</Text>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>💬 Real-Time Chat</Text>
                        <Text style={styles.featureDesc}>Connect instantly with other traders and discuss item conditions in real time.</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>🤝 Make Trade Partners</Text>
                        <Text style={styles.featureDesc}>Build relationships and trade partners along the way to access valuable items.</Text>
                    </View>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>✨ Interesting Items</Text>
                        <Text style={styles.featureDesc}>Explore other people's traded items and discover unique additions for your collection.</Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2025 TradeSmart. All rights reserved.</Text>
                </View>

                {/* Sign Up Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={signUpModalVisible}
                    onRequestClose={() => setSignUpModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Sign Up</Text>
                            <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} placeholderTextColor="#CFCFCF" />
                            <TextInput placeholder="Email" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholderTextColor="#CFCFCF" />
                            <TextInput placeholder="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#CFCFCF" />
                            <TouchableOpacity style={styles.modalButton} onPress={handleSignUp}>
                                <Text style={styles.modalButtonText}>Register</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSignUpModalVisible(false)}>
                                <Text style={styles.modalCloseButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={loginModalVisible}
                    onRequestClose={() => setLoginModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Login</Text>

                            {/* Email Input */}
                            <TextInput
                                placeholder="Email"
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                placeholderTextColor="#CFCFCF"
                            />

                            {/* Password Input with same style as Email and fixed padding */}
                            <View style={{ position: 'relative', marginBottom: 12 }}>
                                <TextInput
                                    placeholder="Password"
                                    style={[styles.input, { paddingVertical: 12, paddingRight: 40 }]} // added right padding for icon
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={hidePassword}
                                    placeholderTextColor="#CFCFCF"
                                />
                                <TouchableOpacity
                                    onPress={() => setHidePassword(!hidePassword)}
                                    style={{ position: 'absolute', right: 12, top: '15%' }} // vertical alignment
                                >
                                    <Ionicons
                                        name={hidePassword ? "eye-off-outline" : "eye-outline"}
                                        size={24}
                                        color="#CFCFCF"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Login Button */}
                            <TouchableOpacity style={styles.modalButton} onPress={handleLogin}>
                                <Text style={styles.modalButtonText}>Login</Text>
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setLoginModalVisible(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0B0B1D',
    },
    scrollView: {
        flex: 1,
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#1C1C3A'
    },
    navTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff'
    },
    navButtons: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    navButton: {
        marginLeft: 15,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#6C63FF'
    },
    navButtonText: {
        color: '#6C63FF',
        fontWeight: 'bold'
    },
    signUpButton: {
        backgroundColor: '#6C63FF'
    },
    signUpButtonText: {
        color: '#fff'
    },
    hero: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        backgroundColor: '#1C1C3A'
    },
    logo: {
        width: 90,
        height: 90,
        marginBottom: 20
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: '#CFCFCF',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 20
    },
    ctaButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 10
    },
    ctaText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    featuresSection: {
        backgroundColor: '#0B0B1D',
        paddingVertical: 40,
        paddingHorizontal: 20
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center'
    },
    featureCard: {
        backgroundColor: '#1C1C3A',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16
    },
    featureTitle: {
        fontSize: 18,
        color: '#6C63FF',
        fontWeight: 'bold',
        marginBottom: 8
    },
    featureDesc: {
        color: '#CFCFCF',
        fontSize: 14,
        lineHeight: 20
    },
    footer: {
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#2E2E50',
        alignItems: 'center',
    },
    footerText: {
        color: '#CFCFCF',
        fontSize: 12
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#1C1C3A',
        borderRadius: 12,
        padding: 20
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center'
    },
    input: {
        backgroundColor: '#0B0B1D',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12
    },
    modalButton: {
        backgroundColor: '#6C63FF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    modalCloseButton: {
        alignItems: 'center'
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16
    },
});