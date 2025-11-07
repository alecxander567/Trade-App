import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Landingpage from './Landingpage';
import Homepage from './Homepage';
import Partners from './Partners';
import Trade from './Trade';
import Messages from './Messages';
import Profile from './Profile';
import Items from './Items';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="LoginScreen" component={Landingpage} />
        <Stack.Screen name="Homepage" component={Homepage} />
        <Stack.Screen name="Partners" component={Partners} />
        <Stack.Screen name="TradesScreen" component={Trade} />
        <Stack.Screen name="MessagesScreen" component={Messages} />
        <Stack.Screen name="ProfileScreen" component={Profile} />
        <Stack.Screen name="ItemsScreen" component={Items} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
