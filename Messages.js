import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function Messages({ route }) {
  const selectedUser = route?.params?.selectedUser;
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const socket = useRef(null);
  const flatListRef = useRef();

  useEffect(() => {
    const loadCurrentUser = async () => {
      const id = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('username');
      if (id) setCurrentUser({ _id: id.replace(/"/g, ''), username });
    };
    loadCurrentUser();
  }, []);

  useEffect(() => {
    socket.current = io('http://192.168.1.99:5000');

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (currentUser && selectedUser) {
      socket.current.emit('register', currentUser._id);

      const handleReceive = message => {
        if (
          (message.sender === selectedUser._id && message.receiver === currentUser._id) ||
          (message.sender === currentUser._id && message.receiver === selectedUser._id)
        ) {
          setMessages(prev => [...prev, message]);
        }
      };

      socket.current.on('receiveMessage', handleReceive);

      fetchMessages();

      return () => {
        socket.current.off('receiveMessage', handleReceive);
      };
    }
  }, [currentUser, selectedUser]);

  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;

    try {
      const res = await fetch(
        `http://192.168.1.99:5000/api/messages/${currentUser._id}/${selectedUser._id}`,
      );
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
      _id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setText('');

    setMessages(prev => [...prev, message]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    socket.current?.emit('sendMessage', message);

    try {
      await fetch('http://192.168.1.99:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!selectedUser) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center', padding: 20 }}>
          Error: No user selected.{'\n'}Please go back and try again.
        </Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Loading user...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.innerContainer}>
        <View style={styles.topHeader}>
          <Text style={styles.topHeaderText}>Messages</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Homepage')}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Display selected user's username */}
        <View style={styles.chatUsernameWrapper}>
          <Text style={styles.chatUsernameText}>
            You're chatting with :{' '}
            <Text style={styles.chatUsernameName}>{selectedUser.username}</Text>
          </Text>
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.messagesList}
          data={messages}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageContainerModern,
                item.sender === currentUser._id ? styles.sentModern : styles.receivedModern,
              ]}
            >
              <Text style={item.sender === currentUser._id ? styles.sentText : styles.receivedText}>
                {item.text}
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
          onLayout={() => {
            if (messages.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }
          }}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListFooterComponent={<View style={{ height: 20 }} />}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B1D',
  },
  innerContainer: {
    flex: 1,
    padding: 10,
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
  chatUsernameWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1C1C3A',
    borderRadius: 10,
    marginBottom: 12,
  },
  chatUsernameText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatUsernameName: {
    color: '#90EE90',
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#1C1C3A',
    borderRadius: 30,
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
  },
  inputModern: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
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
    marginVertical: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
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
    borderTopRightRadius: 10,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  receivedModern: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E2E50',
    borderTopLeftRadius: 10,
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
