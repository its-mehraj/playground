import React from 'react';
import './App.css';
import { Frame } from './Components/Frame';
// import { WaterDrop } from './Components/WaterDrop';
import { SliderContainer } from './Components';

function App() {
  return (
    <div className="container">
      <Frame>
        <SliderContainer />
        {/* <WaterDrop /> */}
      </Frame>
    </div>
  );
}

export default App;
