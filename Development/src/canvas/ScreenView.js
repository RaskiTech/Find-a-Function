import React, { useState } from 'react';
import ExtendedCanvas from './ExtendedCanvas.js'

const ScreenView = props => { 
    const callZoom = (delta) => {
        zoom(delta, lastMousePositionX, lastMousePositionY);
    }

    const { init, draw, zoom, canvasDrag, addDataPoint, ...rest } = props;
    const canvasRef = ExtendedCanvas(draw, init, callZoom);
    
    const [isMouseDown, setMouseDown] = useState(false);
    const [hasDragged, setHasDragged] = useState(false);
    const [lastMousePositionX, setLastMousePositionX] = useState(0);
    const [lastMousePositionY, setLastMousePositionY] = useState(0);
    
    const mouseDown = ({nativeEvent}) => {
        setMouseDown(true);
        setHasDragged(false);
        const {offsetX, offsetY} = nativeEvent;
        setLastMousePositionX(offsetX);
        setLastMousePositionY(offsetY);
    }
    const mouseMove = ({nativeEvent}) => {
        const {offsetX, offsetY} = nativeEvent;
        setLastMousePositionX(offsetX);
        setLastMousePositionY(offsetY);
        
        if (isMouseDown) {
            setHasDragged(true);
            let differenceX = lastMousePositionX - offsetX;
            let differenceY = lastMousePositionY - offsetY;
            canvasDrag(differenceX, differenceY);
        }
    }
    const mouseUp = ({nativeEvent}) => {
        setMouseDown(false);
        if (!hasDragged) {
            // It's a click. Add a point
            const {offsetX, offsetY} = nativeEvent;
            addDataPoint(offsetX, offsetY);
        }
    }

    const touchDown = (event) => {
        setMouseDown(true);
        setHasDragged(false);
        let touch = event.touches[0];
        setLastMousePositionX(touch.clientX);
        setLastMousePositionY(touch.clientY);
    }
    const touchMove = (event) => {
        setHasDragged(true);
        let touch = event.touches[0];
        let differenceX = lastMousePositionX - touch.clientX;
        let differenceY = lastMousePositionY - touch.clientY;
        setLastMousePositionX(touch.clientX);
        setLastMousePositionY(touch.clientY);
        canvasDrag(differenceX, differenceY);
    }
    const touchUp = (event) => {
        setMouseDown(false);
        if (!hasDragged) {
            // It's a click. Add a point
            addDataPoint(lastMousePositionX, lastMousePositionY);
        }
    }
    
    /* 
    window.addEventListener('wheel', (event) => {
        zoom(event.deltaY);
        event.preventDefault();
    }, { passive: false });
    */

    return (
        <canvas id="canvas" className="canvas" onTouchStart={touchDown} onTouchEnd={touchUp} onTouchMove={touchMove}
        onMouseMove={mouseMove} onMouseDown={mouseDown} onMouseUp={mouseUp} ref={canvasRef} {...rest}/>
        /*document.getElementById("canvas").addEventListener('wheel',function(event){
            onScroll(event);
            return false; 
        }, false)*/
    )
}
  
export default ScreenView;