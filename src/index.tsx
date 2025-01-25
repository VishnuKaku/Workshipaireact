import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import reportWebVitals from './reportWebVitals';

const rootElement = document.getElementById('root');

if(!rootElement) {
  throw new Error('Could not find root element in index.html')
}

const root = ReactDOM.createRoot(
    rootElement as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
        <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();