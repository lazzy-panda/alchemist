// Stub for @react-native-async-storage/async-storage in unit tests
const store = {};
const AsyncStorage = {
  getItem: async (key) => store[key] ?? null,
  setItem: async (key, value) => { store[key] = value; },
  removeItem: async (key) => { delete store[key]; },
  clear: async () => { Object.keys(store).forEach((k) => delete store[k]); },
};
export default AsyncStorage;
