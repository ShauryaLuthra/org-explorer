// vite.config.js: Vite's settings file. Vite finds and reads it automatically every time we run npm run dev, build or test.

import { defineConfig } from 'vite' // Load Vite's "defineConfig" helper; it just hands our settings back unchanged but lets VS Code autocomplete setting names.
import vue from '@vitejs/plugin-vue' // Load the Vue plugin from node_modules: it translates our .vue files into plain JavaScript the browser can run.
import tailwindcss from '@tailwindcss/vite' // Load the Tailwind plugin: it scans our files for class names like "rounded-xl" and writes the real CSS for them.

export default defineConfig({ // "export default" hands this settings object to whoever loads this file (Vite itself); { } starts the object, like a Python dict.
  plugins: [ // "plugins" is the setting Vite looks for; [ ] is an array (like a Python list) of add-ons to switch on.
    vue(), // Call the Vue plugin's function (the () runs it); it returns a ready-to-use plugin, which goes into the list.
    tailwindcss(), // Same for Tailwind. The comma at the end is allowed in JavaScript (unlike JSON) and makes adding items easier.
  ], // Close the plugins list.
}) // Close the settings object "}" and then the defineConfig( ... ) call ")".