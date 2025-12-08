// screens/HomeScreen.js (замени)
import React from "react";
import { useUser } from "../context/UserContext";
import DriverHomeScreen from "./DriverHomeScreen";
import CustomerHomeScreen from "./CustomerHomeScreeen";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen() {
  const { user } = useAuth();
  console.log(user);

  if (user?.role === "DRIVER") return <DriverHomeScreen />;
  return <CustomerHomeScreen />;
}
