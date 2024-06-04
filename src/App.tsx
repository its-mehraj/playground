import React from 'react';
import './App.css';

function App() {
  const updateTime = () => {
    const timeLabel = document.getElementById('timeLabel');
    const currentTime = new Date().toISOString();
    if (timeLabel) {
      timeLabel.textContent = currentTime;
    }
  };

  return (
    <div className="container">
      <div id="timeLabel">Current Time</div>
      <button onClick={updateTime}>Update Time</button>
    </div>
  );
}

export default App;
