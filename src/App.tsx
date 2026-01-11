import './App.less';

import React from 'react';
import { Frame } from './Components/Frame';
// import { WaterDrop } from './Components/WaterDrop';
import { MandelBrot } from './Components';

function App() {
  return (
    <div className="container">
      <Frame>
        {/* Hello */}
        {/* <SliderContainer /> */}
        {/* <SliderContainer /> */}
        {/* <MandelbrotCanvas height={200} width={200} /> */}
        {/* <WaterDrop /> */}
        <MandelBrot />
      </Frame>
    </div>
  );
}

export default App;
