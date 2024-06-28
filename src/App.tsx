import React from 'react';
import './App.css';
import { Frame } from './Components/Frame';
import { WaterDrop } from './Components/WaterDrop';

function App() {
  return (
    <div className="container">
      <Frame>
        <WaterDrop />
      </Frame>
    </div>
  );
}

export default App;
