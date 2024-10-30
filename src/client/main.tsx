import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY


if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}









// const onRedirectCallback = (appState: any) => {
//   window.history.replaceState(
//     {},
//     document.title,
//     appState?.target || window.location.pathname
//   );
// };

const helmetContext = {};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider context={helmetContext}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} >
   
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </ClerkProvider>
      </HelmetProvider>
  </React.StrictMode>,
);