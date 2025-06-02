import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Wrap the App inside BrowserRouter with the correct basename for GitHub Pages deployment
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename="/focuswrite-16354-55329e54">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
