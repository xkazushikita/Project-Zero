export interface NotificationPrefs {
  newBrands: boolean;
  pitchesReady: boolean;
  dealActivity: boolean;
  callsBooked: boolean;
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  newBrands: true,
  pitchesReady: true,
  dealActivity: true,
  callsBooked: true,
};
