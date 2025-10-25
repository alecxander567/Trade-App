import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function Messages() {
    const navigation = useNavigation();
    const [messages, setMessages] = useState([
        { id: '1', text: 'Hi there!', sender: 'other' },
        { id: '2', text: 'Hello! How are you?', sender: 'me' },
        { id: '3', text: 'I am good, thanks!', sender: 'other' },
    ]);
    const [inputText, setInputText] = useState('');

    const sendMessage = () => {
        if (inputText.trim() === '') return;
        setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, sender: 'me' }]);
        setInputText('');
    };

    const renderMessage = ({ item }) => (
        <View
            style={[
                styles.messageBubble,
                item.sender === 'me' ? styles.myMessage : styles.otherMessage
            ]}
        >
            <Text style={styles.messageText}>{item.text}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Homepage')}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesContainer}
                inverted
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor="#ccc"
                    value={inputText}
                    onChangeText={setInputText}
                />
                <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                    <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1C1C3A',
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#2E2E50',
        marginBottom: 10
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    messagesContainer: {
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 10,
        borderRadius: 12,
        marginVertical: 5,
    },
    myMessage: {
        backgroundColor: '#1E90FF',
        alignSelf: 'flex-end',
        borderTopRightRadius: 0,
    },
    otherMessage: {
        backgroundColor: '#2E2E50',
        alignSelf: 'flex-start',
        borderTopLeftRadius: 0,
    },
    messageText: {
        color: '#fff',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
    },
    input: {
        flex: 1,
        backgroundColor: '#2E2E50',
        color: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: '#1E90FF',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginLeft: 10,
    },
    sendText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
