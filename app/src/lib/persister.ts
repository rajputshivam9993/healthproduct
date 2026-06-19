import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Persists the React Query cache to AsyncStorage so critical data (profile,
// upcoming appointments, prescriptions) is available offline (Req 16.1, 16.2).
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'doctor360-query-cache',
});

// Bridge device connectivity into React Query so queries/mutations pause offline
// and resume (with retry) on reconnect (Req 16.3).
export function wireOnlineManager(): void {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected))),
  );
}
