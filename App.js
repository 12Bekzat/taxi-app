import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen"; // گُگ?گَگّگْ‘<گ?گّگç‘' Customer/Driver
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";

// ‘?‘'‘?گّگ?گٌ‘إ‘< گٌگْ گُ‘?گ?‘"گٌگ>‘?:
import PlusScreen from "./screens/PlusScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import MessagesScreen from "./screens/MessagesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import VehicleScreen from "./screens/VehicleScreen";
import DocumentsScreen from "./screens/DocumentsScreen";
import PayoutsScreen from "./screens/PayoutsScreen";
import AddAccountScreen from "./screens/AddAccountScreen";

import FavoritesScreen from "./screens/FavoriteScreen";
import RegisterScreen from "./screens/RegisterScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UserProvider, useUser } from "./context/UserContext";
import DriverDocumentsScreen from "./screens/DriverDocumentsScreen";
import DriverVehicleScreen from "./screens/DriverVehicleScreen";
import SupportScreen from "./screens/SupportScreeen";
import DriverPayoutsScreen from "./screens/DriverPayoutsScreen";
import DriverRatingScreen from "./screens/DriverRatingScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useUser();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#E30613",
        tabBarInactiveTintColor: "#6A6A6A",
        tabBarStyle: { height: 60, paddingBottom: 85, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Home: "compass-outline",
            Orders: "time-outline",
            Profile: "person-outline",
          };
          return <Ionicons name={map[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        options={{ title: 'گ"گ>گّگ?گ?گّ‘?' }}
        component={HomeScreen}
      />
      {/* گ-گّگ?گ>‘?‘?گَگّ ‚<گ-گّگَگّگْ‘<‚> ¢?" گُگ? گ?گçگ?گ+‘:گ?گ?گٌگ?گ?‘?‘'گٌ گْگّگُگ?گ>گ?گٌگ? گُگ?گْگگç */}
      <Tab.Screen
        name="Orders"
        options={{ title: "گ-گّگَگّگْ‘<" }}
        component={FavoritesScreen}
      />
      <Tab.Screen
        name="Profile"
        options={{ title: 'گ?‘?گ?‘"گٌگ>‘?' }}
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "Login" }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Register" }}
      />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Plus" component={PlusScreen} />
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
      <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverPayouts"
        component={DriverPayoutsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DriverRating"
        component={DriverRatingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Vehicle" component={VehicleScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Payouts" component={PayoutsScreen} />
      <Stack.Screen name="AddAccount" component={AddAccountScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <RootNavigator />
      </UserProvider>
    </AuthProvider>
  );
}
