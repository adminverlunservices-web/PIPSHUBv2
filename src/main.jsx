import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../assets/pipshub.css';
import { enableClientProtection } from '../seccuro/security.js';

enableClientProtection();
createRoot(document.getElementById('root')).render(<App />);
