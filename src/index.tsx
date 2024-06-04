import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const app = document.getElementById('root');

// if(app == null){
//   return
// }

if (app != null) {
  const root = createRoot(app);

  root.render(<App />);
}
