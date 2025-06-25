

// @ts-check
// version 0.11.9
import { defineConfig } from '@deskthing/cli';
import DotEnv from 'dotenv';
DotEnv.config();

export default defineConfig({
  development: {
    logging: {
      level: "info",
      prefix: "[DeskThing Server]",
    },
    client: {
      logging: {
        level: "info",
        prefix: "[DeskThing Client]",
        enableRemoteLogging: true,
      },
      clientPort: 3000,
      viteLocation: "http://localhost",
      vitePort: 5173,
      linkPort: 8080,
    },
    server: {
      editCooldownMs: 1000,
      mockData: {
        settings: {
          refreshInterval: 15,
          gitHubAccessToken: process.env.GITHUB_ACCESS_TOKEN || '',
        }
      }
    },
  }
});
  