import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './modules/app/App';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

