import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import io from "socket.io-client";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from "@react-navigation/native";

export default function Messages({ route }) {
    const selectedUser = route?.params?.selectedUser;
    const navigation = useNavigation();
    const [currentUser, setCurrentUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const socket = useRef(null);

    useEffect(() => {
        const loadCurrentUser = async () => {
            const id = await AsyncStorage.getItem('userId');
            const username = await AsyncStorage.getItem('username');
            if (id) setCurrentUser({ _id: id.replace(/"/g, ''), username });
        };
        loadCurrentUser();
    }, []);

    useEffect(() => {
        if (!currentUser || !selectedUser) return;

        socket.current = io("http://192.168.1.99:5000");
        socket.current.emit("register", currentUser._id);

        socket.current.on("receiveMessage", (message) => {
            if (message.sender === selectedUser._id) {
                setMessages((prev) => [...prev, message]);
            }
        });

        fetchMessages();

        return () => {
            socket.current?.disconnect();
        };
    }, [currentUser, selectedUser]);

    const fetchMessages = async () => {
        if (!currentUser || !selectedUser) return;

        try {
            const res = await fetch(`http://192.168.1.99:5000/api/messages/${currentUser._id}/${selectedUser._id}`);
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = async () => {
        if (!text.trim() || !currentUser || !selectedUser) return;

        const message = {
            sender: currentUser._id,
            receiver: selectedUser._id,
            text,
        };

        socket.current?.emit("sendMessage", message);

        try {
            await fetch("http://192.168.1.99:5000/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(message),
            });

            setMessages((prev) => [...prev, message]);
            setText("");
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!selectedUser) {
        return (
            <View style={styles.container}>
                <Text style={{ color: "#fff", textAlign: "center", padding: 20 }}>
                    Error: No user selected.{'\n'}Please go back and try again.
                </Text>
            </View>
        );
    }

    if (!currentUser) {
        return (
            <View style={styles.container}>
                <Text style={{ color: "#fff", textAlign: "center" }}>Loading user...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topHeader}>
                <Text style={styles.topHeaderText}>Messages</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Homepage')}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item._id || Math.random().toString()}
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageContainerModern,
                            item.sender === currentUser._id
                                ? styles.sentModern
                                : styles.receivedModern,
                        ]}
                    >
                        <Text style={item.sender === currentUser._id ? styles.sentText : styles.receivedText}>
                            {item.text}
                        </Text>
                    </View>
                )}
            />

            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.inputModern}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message..."
                    placeholderTextColor="#999"
                />
                <TouchableOpacity style={styles.sendButtonModern} onPress={sendMessage}>
                    <Text style={styles.sendTextModern}>➤</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: "#0B0B1D"
    },
    header: {
        padding: 15,
        backgroundColor: '#1C1C3A',
        borderRadius: 8,
        marginBottom: 10,
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    messageContainer: {
        marginVertical: 5,
        padding: 10,
        borderRadius: 10,
        maxWidth: '80%',
    },
    sent: {
        alignSelf: "flex-end",
        backgroundColor: "#007AFF"
    },
    received: {
        alignSelf: "flex-start",
        backgroundColor: "#E5E5EA"
    },
    text: {
        color: "#fff"
    },
    inputContainer: {
        flexDirection: "row",
        marginTop: 10,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 20,
        padding: 10,
        color: '#fff',
        backgroundColor: '#1C1C3A',
    },
    sendButton: {
        backgroundColor: "#007AFF",
        padding: 10,
        marginLeft: 5,
        borderRadius: 20
    },
    sendText: {
        color: "#fff",
        fontWeight: 'bold',
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        backgroundColor: '#1C1C3A',
        borderRadius: 8,
        marginBottom: 10,
    },
    topHeaderText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    backText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#1C1C3A',
        borderRadius: 25,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 5,
    },
    inputModern: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#2A2A40',
        color: '#fff',
        fontSize: 16,
    },
    sendButtonModern: {
        marginLeft: 8,
        backgroundColor: '#007AFF',
        borderRadius: 25,
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 5,
        elevation: 5,
    },
    sendTextModern: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    messageContainerModern: {
        marginVertical: 5,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        elevation: 3,
    },
    sentModern: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        borderTopRightRadius: 5,
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    receivedModern: {
        alignSelf: 'flex-start',
        backgroundColor: '#2E2E50',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    sentText: {
        color: '#fff',
        fontSize: 16,
    },
    receivedText: {
        color: '#fff',
        fontSize: 16,
    },
});