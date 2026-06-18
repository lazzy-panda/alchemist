import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
    setupFiles: ['./vitest.setup.js'],
    alias: {
      'react-native': path.resolve('./vitest.mocks/react-native.js'),
      '@react-native-async-storage/async-storage': path.resolve('./vitest.mocks/async-storage.js'),
    },
  },
  plugins: [{
    name: 'stub-rn-assets',
    // replace require('../assets/...') calls inline so ESM parse doesn't choke
    transform(code, id) {
      if (!id.endsWith('.js') && !id.endsWith('.jsx')) return;
      if (!code.includes('require(')) return;
      const patched = code.replace(/require\(['"][^'"]*\.(png|jpg|jpeg|gif|webp|svg)['"]\)/g, '"__asset__"');
      if (patched !== code) return { code: patched, map: null };
    },
  }],
});
