import { createApp } from 'vue' // Load Vue's createApp function, which builds a Vue app from a top-level screen.
import App from './App.vue' // Load our top-level screen. "./" means "from this same folder" (src); the Vue plugin translates the .vue file for us.
import './style.css' // Load the stylesheet so Tailwind's CSS applies to the whole page. There's no name before "from" because we only need it loaded, not used by name.

createApp(App).mount('#app') // Build the app with App as its top screen, then place it inside <div id="app"> from index.html ("#app" means "the element whose id is app").
