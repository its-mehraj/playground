import React from 'react';
import './App.css';

function App() {
  const updateTime = () => {
    const timeLabel = document.getElementById('timeLabel');
    const currentTime = new Date().toISOString();
    timeLabel.textContent = currentTime;
  };

  return (
    <div className="container">
      <label id="timeLabel">Current Time</label>
      <button onClick={updateTime}>Update Time</button>
    </div>
  );
}

export default App;
