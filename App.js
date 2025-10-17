import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Landingpage from './Landingpage';
import Homepage from './Homepage';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="LoginScreen"
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="LoginScreen" component={Landingpage} />
                <Stack.Screen name="Homepage" component={Homepage} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}