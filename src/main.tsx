import { createRoot } from 'react-dom/client'
import "@codegouvfr/react-dsfr/main.css";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)