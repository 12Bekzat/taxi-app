// api/equipment.js
import { request } from './client';

export async function fetchEquipmentTypes() {
  const data = await request('/equipment-types', {
    method: 'GET',
  });
  return data;
}