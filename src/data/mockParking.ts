/**
 * Mock data layer — simulates the IoT signals coming from ESP8266.
 * Replace this file (or its consumers) with real API calls when hardware is ready.
 *
 * The ESP8266 should POST to /api/parking with the same shape returned by `getInitialSpots()`.
 */

export type SpotStatus = "free" | "occupied" | "reserved";

export interface ParkingSpot {
  id: number;
  status: SpotStatus;
  reservedUntil?: number; // timestamp ms
}

// ⚙️ Fixed inputs — these will be replaced by ESP8266 sensor signals later.
// Spot 1 & 3 = free, Spot 2 = occupied, Spot 4 = free.
export const INITIAL_SPOTS: ParkingSpot[] = [
  { id: 1, status: "free" },
  { id: 2, status: "free" },
  { id: 3, status: "free" },
  { id: 4, status: "free" },
];

export const HOURLY_TRAFFIC = [
  { hour: "08h", entries: 4 },
  { hour: "09h", entries: 9 },
  { hour: "10h", entries: 12 },
  { hour: "11h", entries: 8 },
  { hour: "12h", entries: 15 },
  { hour: "13h", entries: 18 },
  { hour: "14h", entries: 11 },
  { hour: "15h", entries: 7 },
  { hour: "16h", entries: 10 },
  { hour: "17h", entries: 16 },
  { hour: "18h", entries: 19 },
  { hour: "19h", entries: 13 },
  { hour: "20h", entries: 6 },
];

export const OCCUPANCY_HISTORY = [
  { time: "08h", rate: 20 },
  { time: "09h", rate: 35 },
  { time: "10h", rate: 50 },
  { time: "11h", rate: 45 },
  { time: "12h", rate: 75 },
  { time: "13h", rate: 90 },
  { time: "14h", rate: 65 },
  { time: "15h", rate: 50 },
  { time: "16h", rate: 60 },
  { time: "17h", rate: 80 },
  { time: "18h", rate: 95 },
  { time: "19h", rate: 70 },
];

export const BUSINESS_CONFIG = {
  basePrice: 2, // TND / hour
  surgeThreshold: 70, // % occupancy
  surgeMultiplier: 1.2, // +20%
  alertThreshold: 80, // % → toast warning
};
