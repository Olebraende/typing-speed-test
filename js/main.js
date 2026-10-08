import { App } from './app.js';
import { loadPassages } from './passages.js';

async function bootstrap() {
  try {
    const passages = await loadPassages();
    new App(passages).init();
  } catch (error) {
    console.error(error);
    document.getElementById('passage').textContent =
      'Could not load the passages. Please serve the project over HTTP and reload.';
  }
}

bootstrap();
