import {React, useState} from 'react'
import './index.css'
import './App.css'
import {Navbar, Button, Col, Form, Row, Dropdown, NavDropdown, Nav } from 'react-bootstrap'
import FunctionData from './canvas/FunctionData.js'

function TopBar({ addPoint, clear, findingDone, startFunctionFind, functionIndex, setFunctionIndex }) {

    const [yFieldValue, setYFieldValue] = useState("");
    const [xFieldValue, setXFieldValue] = useState("");
    const [xInvalid, setXInvalid] = useState(false);
    const [yInvalid, setYInvalid] = useState(false);

    function addPointEvent() {
        let invalid = xFieldValue === "" || yFieldValue === ""
        setXInvalid(xFieldValue === "");
        setYInvalid(yFieldValue === "");
        if (invalid) return;

        setYFieldValue("");
        setXFieldValue("");
        addPoint(Number(xFieldValue), Number(yFieldValue));
    }

    const changeFocusingField = (event, delta) => {
        let key = event.key.toLowerCase();

        const acceptedKeys = ["enter"];
        const switchIfCaretAtRightmost = ["arrowright"];
        const switchIfCaretAtLeftmost = ["arrowleft"];

        if (acceptedKeys.includes(key)
            || (switchIfCaretAtRightmost.includes(key) && event.target.selectionStart === event.target.defaultValue.length)
            || (switchIfCaretAtLeftmost.includes(key) && event.target.selectionStart === 0))
        {
            //event.target.selectionStart = event.target.defaultValue.length;
            const form = event.target.form;
            const index = [...form].indexOf(event.target);
            form.elements[index + delta].focus();
            event.preventDefault();
        }
        
    }

    const ValidateFieldAsNumber = (onInputEvent) => {
        return onInputEvent.target.value
            /* Convert commas to dots */
            .replace(',', '.')
            // Allow only numbers, a dot and a negative sign
            .replace(/[^0-9.,-]/g, '')
            // Don't allow for a dot if there already exists a dot
            .replace(/(\..*)\./g, '$1')
            // Don't allow for a negative sign if this isn't the first character
            .replace(/(?<=.)[-]/g, '')
    }

    const findBestText = "Best fit";
    if (functionIndex === undefined)
        setFunctionIndex(findBestText);

    return (
        <Navbar className="topBar" expand="lg" sticky="top">
            <Col className="leftSide">
                    <p className="logoText horPadding">Find a Function</p>

                    <Button className="btnStyle horPadding" onClick={() => clear()}>Clear</Button>
            </Col>

            <Col className="center">
                <Col>
                    <Nav style={{"justifyContent": "right"}}>
                        <NavDropdown className="dropdownStyle horPadding" title={functionIndex >= 0 ? FunctionData[functionIndex][3] : findBestText}
                            onSelect={(index, event) => setFunctionIndex(index)}>
                            <Dropdown.Item as="button" eventKey={-1} key={-1}>{findBestText}</Dropdown.Item>
                            {
                                FunctionData.map((func, index) => ( <Dropdown.Item as="button" eventKey={index} key={index}>{func[3]}</Dropdown.Item>))
                            }
                        </NavDropdown>
                    </Nav>
                </Col>
                <Col>
                    <Button className="btnStyle horPadding" disabled={!findingDone} onClick={() => startFunctionFind()}>{findingDone ? "Start Find" : "Finding..."}</Button>
                </Col>
            </Col>

            <Col>
                <Form className="rightSide">
                    <div className="numberField">
                        <Form.Control className="moveDownLittle" isInvalid={xInvalid} size="sm" type="text" placeholder="X-Coord" 
                            value={xFieldValue} onInput={(event) => setXFieldValue(ValidateFieldAsNumber(event))}
                            onKeyDown={(event) => {changeFocusingField(event, 1)}}/>
                    </div>
                    <div className="numberField">
                        <Form.Control className="moveDownLittle" isInvalid={yInvalid} size="sm" type="text" placeholder="Y-Coord"
                            value={yFieldValue} onInput={(event) => setYFieldValue(ValidateFieldAsNumber(event))}
                            onKeyDown={(event) => {
                                changeFocusingField(event, -1);
                                if (event.key.toLowerCase() === "enter")
                                    addPointEvent();
                            }}/>
                    </div>
                    <Button className="btnStyle" onClick={addPointEvent}>Add</Button>
                </Form>
            </Col>

        </Navbar>
    );
}

export default TopBar;