import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    fs: {
      // allow reading files from project root to fetch /tenders.json
      allow: [path.resolve(__dirname, '..')],
    },
  },
});


