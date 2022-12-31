import { useRef, useEffect, useState } from 'react'

const ExtendedCanvas = (draw, init, zoom) => {
  
  const canvasRef = useRef(null)
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [firstUpdate, setFirstUpdate] = useState(true);
  
  const updateWidthAndHeight = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  const callZoom = (event) => {
    zoom(event.deltaY);
    event.preventDefault();
  }

  useEffect(() => {

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.left = "0px";
    canvas.style.top = "0px";
    canvas.style.position = "absolute";
    if (firstUpdate) {
      setFirstUpdate(false);
      init(context);
    }
    draw(context);

    window.addEventListener("resize", updateWidthAndHeight);
    window.addEventListener("wheel", callZoom, { passive: false });
    return () => {window.removeEventListener("resize", updateWidthAndHeight);
                  window.removeEventListener("wheel", callZoom, { passive: false });}
  }, [firstUpdate, callZoom, draw, init])
  
  return canvasRef;
}

export default ExtendedCanvas;