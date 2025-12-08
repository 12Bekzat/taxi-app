import React, { createContext, useContext, useState } from 'react';

// Базовый мок-профиль после логина.
// role: 'customer' | 'driver'
const initialUser = {
  id: 'u1',
  role: 'customer',
  name: 'Иван Петров',
  phone: '+7 701 123 45 67',
  email: 'ivan@example.com',
  avatar: null, // uri
  rating: 4.9,
  totalTrips: 128,
  // данные водителя
  vehicleType: 'tow_truck',
  vehiclePlate: '123 ABC 01',
  licenseNumber: '1234 567890',
  licenseExpiry: '12.03.2027',
  licenseImages: null, // {frontUri, backUri}
  idCardImages: null,  // {frontUri, backUri}
  // финансы (для водителя)
  todayEarnings: 18500,
  weekEarnings: 97200,
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(initialUser);
  const updateUser = (patch) => setUser(prev => ({ ...prev, ...patch }));
  return <UserContext.Provider value={{ user, updateUser }}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
