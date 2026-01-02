import { DeviceEventEmitter, EmitterSubscription } from 'react-native';

const CLIENTS_UPDATED = 'trainer:clientsUpdated';

export const emitClientsUpdated = () => {
  DeviceEventEmitter.emit(CLIENTS_UPDATED);
};

export const onClientsUpdated = (handler: () => void): EmitterSubscription =>
  DeviceEventEmitter.addListener(CLIENTS_UPDATED, handler);
