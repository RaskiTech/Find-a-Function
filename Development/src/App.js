import './App.css';
import { React, useState } from 'react';
import CoordinatePlane from './canvas/CoordinatePlane';
import TopBar from './TopBar.js';

function App() {
  const [points, setPoints] = useState([]);
  const [clearBoardFlag, setClearBoardFlag] = useState(false);

  // -1 is uses the best fit line, an index uses the function at that index
  const [functionIndex, setFunctionIndex] = useState(-1);

  const [findingBestLine, setFindingBestLine] = useState(false);
  const [findingDone, setFindingDone] = useState(true);

  function addPoint(x, y) {
    setPoints([...points, [x, y]]);
  }
  function clear() {
    setPoints([]);
    setClearBoardFlag(!clearBoardFlag);
  }
  function startFunctionFind() {
    setFindingBestLine(true);
    setFindingDone(false);
  }
  function stopFunctionFind() {
    setFindingBestLine(false);
    setFindingDone(true);
  }

  return (
    <div>
      <TopBar addPoint={addPoint} clear={clear} findingDone={findingDone} 
        startFunctionFind={startFunctionFind} 
        functionIndex={functionIndex} setFunctionIndex={setFunctionIndex}/>
      <CoordinatePlane clearBoardFlag={clearBoardFlag} points={points} findingBestLine={findingBestLine} functionIndex={functionIndex} stopFunctionFind={stopFunctionFind}/>
    </div>
  );
}

export default App;
