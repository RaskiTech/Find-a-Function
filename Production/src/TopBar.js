import {React, useState} from 'react'
import COLORS from './colors.js'
import './index.css'
import './App.css'
import {Navbar, Button, Col, Form, Row } from 'react-bootstrap'

function TopBar(props) {
    const { addPoint } = props; 
    const btnStyle = { backgroundColor: COLORS.yellowDark, borderColor: COLORS.yellowDark };
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
            || (switchIfCaretAtRightmost.includes(key) && event.target.selectionStart == event.target.defaultValue.length)
            || (switchIfCaretAtLeftmost.includes(key) && event.target.selectionStart == 0))
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

    return (
        <Navbar style={{background: COLORS.turquoise}} expand="lg" sticky="top">
            <Col>
                <div className="leftSide">
                    <h7 className="logoText">Find a Function</h7>

                    <Button style={btnStyle} onClick={() => props.clear()}>Clear</Button>
                </div>
            </Col>

            <Col>
                <div className="center">
                    <Button style={btnStyle} disabled={!props.findingDone} onClick={() => props.startFunctionFind()}>{props.findingDone ? "Start Find" : "Finding..."}</Button>
                </div>
            </Col>

            <Col>
                <div className="rightSide">
                    <Form>
                        <Row>
                            <Col className="numberField">
                                <Form.Control isInvalid={xInvalid} size="sm" type="text" placeholder="X-Coord" 
                                    value={xFieldValue} onInput={(event) => setXFieldValue(ValidateFieldAsNumber(event))}
                                    onKeyDown={(event) => {changeFocusingField(event, 1)}}/>
                            </Col>
                            <Col className="numberField">
                                <Form.Control style={{"vertical-align": "middle"}} isInvalid={yInvalid} size="sm" type="text" placeholder="Y-Coord"
                                    value={yFieldValue} onInput={(event) => setYFieldValue(ValidateFieldAsNumber(event))}
                                    onKeyDown={(event) => {
                                        changeFocusingField(event, -1);
                                        if (event.key.toLowerCase() === "enter")
                                            addPointEvent();
                                    }}/>
                            </Col>
                            <Col style={{width: "20%"}}>
                                <Button style={btnStyle} onClick={addPointEvent}>Add</Button>
                            </Col>
                        </Row>
                    </Form>
                </div>
            </Col>

        </Navbar>
    );
}

export default TopBar;