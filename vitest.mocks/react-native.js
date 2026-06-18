// Stub for react-native in unit tests — only exports the symbols engine.js / theme.js need
export const Platform = { OS: 'web', select: (obj) => obj.web ?? obj.default ?? null };
export const useState = () => [null, () => {}];
export const useCallback = (fn) => fn;
export const useEffect = () => {};
export const useRef = (v) => ({ current: v });
export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const useWindowDimensions = () => ({ width: 375, height: 812 });
export const StyleSheet = { create: (s) => s, flatten: (s) => s };
export default {};
