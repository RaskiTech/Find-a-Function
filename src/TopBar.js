import {React, useState} from 'react'
import COLORS from './colors.js'
import './index.css'
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
        const acceptedKeys = ["arrowright", "arrowleft", "enter"];
        if (!acceptedKeys.includes(key))
            return;
        
        const form = event.target.form;
        const index = [...form].indexOf(event.target);
        form.elements[index + delta].focus();
        event.preventDefault();
    }

    return (
        <Navbar style={{background: COLORS.turquoise}} expand="lg" sticky="top">
            <Col>
                <div className="leftSide">
                    <Navbar.Brand className="ml-2">Find a Function</Navbar.Brand>

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
                            <Col style={{width: "40%"}}>
                                <Form.Control isInvalid={xInvalid} size="sm" type="text" placeholder="X-Coord" 
                                    value={xFieldValue} onInput={(event) => setXFieldValue(event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
                                    onKeyDown={(event) => {changeFocusingField(event, 1)}}/>
                            </Col>
                            <Col style={{width: "40%"}}>
                                <Form.Control isInvalid={yInvalid} size="sm" type="text" placeholder="Y-Coord"
                                    value={yFieldValue} onInput={(event) => setYFieldValue(event.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
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