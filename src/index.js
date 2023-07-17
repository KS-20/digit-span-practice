import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import reportWebVitals from './reportWebVitals.js';
import { appEngine } from './source.js'
import './debugUtils.js'
import * as serviceWorkerRegistration from './serviceWorkerRegistration.js';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App appEngine={appEngine} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

serviceWorkerRegistration.register();