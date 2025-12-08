// components/OSMMap.js
import React from 'react';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { View, StyleSheet } from 'react-native';
import { TILE_URL } from '../constants/maps';

export default function OSMMap({
  initialRegion,
  fromMarker,
  toMarker,
  routePoints,
  onLongPress,   // (coord) => void
  children
}) {
  return (
    <View style={{ flex:1 }}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onLongPress={(e)=> onLongPress?.(e.nativeEvent.coordinate)}
      >
        <UrlTile urlTemplate={TILE_URL} maximumZ={19} flipY={false} />
        {fromMarker ? (
          <Marker coordinate={fromMarker} title="Откуда" pinColor="#22C55E" />
        ) : null}
        {toMarker ? (
          <Marker coordinate={toMarker} title="Куда" pinColor="#EF4444" />
        ) : null}
        {routePoints?.length ? (
          <Polyline coordinates={routePoints} strokeWidth={5} strokeColor="#E30613" />
        ) : null}
      </MapView>
      {children}
    </View>
  );
}
