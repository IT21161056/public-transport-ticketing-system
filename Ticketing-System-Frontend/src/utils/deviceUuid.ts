/**
 * Anonymous Device UUID Management for Guest Visitors
 * As per Design Document Section 2.1 & 3.2:
 * "Frontend checks localStorage for device_uuid. If empty, it generates one."
 */

const DEVICE_UUID_KEY = 'device_uuid';

export function getOrCreateDeviceUuid(): string {
  let deviceUuid = localStorage.getItem(DEVICE_UUID_KEY);
  if (!deviceUuid) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      deviceUuid = crypto.randomUUID();
    } else {
      deviceUuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(DEVICE_UUID_KEY, deviceUuid);
  }
  return deviceUuid;
}

export function getDeviceUuid(): string | null {
  return localStorage.getItem(DEVICE_UUID_KEY);
}

export function resetDeviceUuid(): string {
  localStorage.removeItem(DEVICE_UUID_KEY);
  return getOrCreateDeviceUuid();
}
