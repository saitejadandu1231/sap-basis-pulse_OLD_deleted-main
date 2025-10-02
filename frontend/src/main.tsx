import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add global error handlers for production
if (process.env.NODE_ENV === 'production') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default handler
    event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
