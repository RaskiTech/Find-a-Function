import './App.css';
import { React, useEffect, useState, useRef } from 'react';
import CoordinatePlane from './canvas/CoordinatePlane';
import TopBar from './TopBar.js';
import { Alert } from 'react-bootstrap';

function ContainsXValue(x, points) {
  for (let i = 0; i < points.length; i++) {
    if (points[i][0] === x) {
      return true;
    }
  }

  return false;
}

function App() {
  const [points, setPoints] = useState([]);
  const [clearBoardFlag, setClearBoardFlag] = useState(false);

  // -1 is uses the best fit line, an index uses the function at that index
  const [functionIndex, setFunctionIndex] = useState(-1);

  const [findingBestLine, setFindingBestLine] = useState(false);
  const [findingDone, setFindingDone] = useState(true);

  const [alertPopup, setAlertPopup] = useState("That is not allowed.");
  const alertRef = useRef(null);

  function addPoint(x, y) {
    if (ContainsXValue(x, points)) {
      StartAlertSequence("That x-coordinate already has a point.");
      return;
    }

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

  function StartAlertSequence(text) {
    setAlertPopup(text);
                     alertRef.current.classList.toggle("alertUp")
    setTimeout(() => alertRef.current.classList.toggle("alertUp"), 2000)
  }


  return (
    <>
      <TopBar addPoint={addPoint} clear={clear} findingDone={findingDone} 
        startFunctionFind={startFunctionFind} 
        functionIndex={functionIndex} setFunctionIndex={setFunctionIndex}
      />
      {
        alertPopup === "" ?
          null :
          <div>
            <Alert ref={alertRef} className="errorAlert alertUp" variant="danger"> {alertPopup} </Alert>
          </div>
      }
      <CoordinatePlane clearBoardFlag={clearBoardFlag} points={points}
        findingBestLine={findingBestLine}
        functionIndex={functionIndex}
        stopFunctionFind={stopFunctionFind}
        showAlertPopup={StartAlertSequence}
      />
    </>
  );
}

export default App;
