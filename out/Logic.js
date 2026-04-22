
import { toString, Record } from "./fable_modules/fable-library-js.5.0.0/Types.js";
import { record_type, bool_type, option_type, float64_type, string_type } from "./fable_modules/fable-library-js.5.0.0/Reflection.js";
import { createAtom } from "./fable_modules/fable-library-js.5.0.0/Util.js";
import { parse, isInfinity } from "./fable_modules/fable-library-js.5.0.0/Double.js";
import { printf, toText, substring } from "./fable_modules/fable-library-js.5.0.0/String.js";
import { Operators_IsNull } from "./fable_modules/fable-library-js.5.0.0/FSharp.Core.js";
import { isDigit } from "./fable_modules/fable-library-js.5.0.0/Char.js";

export class State extends Record {
    constructor(Display, StoredValue, PendingOp, ClearDisplayOnNext, IsExploded, IsArming) {
        super();
        this.Display = Display;
        this.StoredValue = StoredValue;
        this.PendingOp = PendingOp;
        this.ClearDisplayOnNext = ClearDisplayOnNext;
        this.IsExploded = IsExploded;
        this.IsArming = IsArming;
    }
}

export function State_$reflection() {
    return record_type("Logic.State", [], State, () => [["Display", string_type], ["StoredValue", option_type(float64_type)], ["PendingOp", option_type(string_type)], ["ClearDisplayOnNext", bool_type], ["IsExploded", bool_type], ["IsArming", bool_type]]);
}

export const initialState = new State("0", undefined, undefined, false, false, false);

export let currentState = createAtom(initialState);

export function formatDisplay(n) {
    if (Number.isNaN(n) ? true : isInfinity(n)) {
        return "ERROR";
    }
    else {
        const s = n.toString();
        const maxLength = 12;
        if (s.length > maxLength) {
            const exp = n.toExponential(5);
            if (exp.length > maxLength) {
                const dynamicExp = n.toExponential(3);
                if (dynamicExp.length > maxLength) {
                    return substring(dynamicExp, 0, maxLength);
                }
                else {
                    return dynamicExp;
                }
            }
            else {
                return exp;
            }
        }
        else {
            return s;
        }
    }
}

export function calculate(v1, v2, op) {
    switch (op) {
        case "+":
            return v1 + v2;
        case "-":
            return v1 - v2;
        case "*":
            return v1 * v2;
        case "/":
            if (v2 === 0) {
                return NaN;
            }
            else {
                return v1 / v2;
            }
        case "^":
            return Math.pow(v1, v2);
        default:
            return v2;
    }
}

export function resetSwitchUI() {
    const checkbox = document.querySelector(".rocker input");
    if (!Operators_IsNull(checkbox)) {
        checkbox.checked = false;
    }
}

export function render() {
    const display = document.getElementById("display");
    if (!Operators_IsNull(display)) {
        display.innerText = currentState().Display;
    }
    const ledR = document.getElementById("red-led");
    if (!Operators_IsNull(ledR)) {
        if (currentState().IsArming && !currentState().IsExploded) {
            ledR.classList.add("arming");
        }
        else {
            ledR.classList.remove("arming");
            ledR.style.removeProperty("--blink-speed");
        }
    }
    const ledY = document.querySelector(".led-y");
    if (!Operators_IsNull(ledY)) {
        if (currentState().IsArming ? true : currentState().IsExploded) {
            ledY.style.opacity = "0.1";
            ledY.style.boxShadow = "none";
        }
        else {
            ledY.style.opacity = "1";
            ledY.style.boxShadow = "0 0 10px #ffff00";
        }
    }
    const body = document.querySelector("body");
    if (!Operators_IsNull(body)) {
        if (currentState().IsExploded) {
            body.classList.add("boom");
        }
        else {
            body.classList.remove("boom");
        }
    }
}

export function startCountdown() {
    let count = 5;
    const tick = () => {
        let arg;
        if (!currentState().IsArming ? true : currentState().IsExploded) {
        }
        else if (count >= 0) {
            currentState(new State((arg = (count | 0), toText(printf("00:0%d"))(arg)), currentState().StoredValue, currentState().PendingOp, currentState().ClearDisplayOnNext, currentState().IsExploded, currentState().IsArming));
            render();
            const ledElement = document.getElementById("red-led");
            if (!Operators_IsNull(ledElement)) {
                const speed = (count === 1) ? "0.1s" : ((count === 2) ? "0.2s" : ((count === 3) ? "0.4s" : ((count === 4) ? "0.6s" : ((count === 5) ? "0.8s" : "0.05s"))));
                ledElement.style.setProperty("--blink-speed", speed);
            }
            count = ((count - 1) | 0);
            window.setTimeout(tick, 1000);
        }
        else {
            currentState(new State("BOOM", currentState().StoredValue, currentState().PendingOp, currentState().ClearDisplayOnNext, true, false));
            render();
            window.setTimeout((_arg) => {
                resetSwitchUI();
                currentState(initialState);
                render();
            }, 5000);
        }
    };
    tick();
}

export function update(msg, state) {
    let digit, digit_1, op, digit_2, op_1, digit_3, op_2;
    if (state.IsExploded ? true : state.IsArming) {
        return state;
    }
    else {
        let matchResult, digit_4, op_3;
        switch (msg) {
            case "C": {
                matchResult = 0;
                break;
            }
            case "DEL": {
                matchResult = 1;
                break;
            }
            case ".": {
                if ((digit = msg, (digit.length === 1) && isDigit(digit[0]))) {
                    matchResult = 2;
                    digit_4 = msg;
                }
                else {
                    matchResult = 3;
                }
                break;
            }
            case "sqrt": {
                if ((digit_1 = msg, (digit_1.length === 1) && isDigit(digit_1[0]))) {
                    matchResult = 2;
                    digit_4 = msg;
                }
                else if ((op = msg, ((((op === "+") ? true : (op === "-")) ? true : (op === "*")) ? true : (op === "/")) ? true : (op === "^"))) {
                    matchResult = 4;
                    op_3 = msg;
                }
                else {
                    matchResult = 5;
                }
                break;
            }
            case "=": {
                if ((digit_2 = msg, (digit_2.length === 1) && isDigit(digit_2[0]))) {
                    matchResult = 2;
                    digit_4 = msg;
                }
                else if ((op_1 = msg, ((((op_1 === "+") ? true : (op_1 === "-")) ? true : (op_1 === "*")) ? true : (op_1 === "/")) ? true : (op_1 === "^"))) {
                    matchResult = 4;
                    op_3 = msg;
                }
                else {
                    matchResult = 6;
                }
                break;
            }
            default:
                if ((digit_3 = msg, (digit_3.length === 1) && isDigit(digit_3[0]))) {
                    matchResult = 2;
                    digit_4 = msg;
                }
                else if ((op_2 = msg, ((((op_2 === "+") ? true : (op_2 === "-")) ? true : (op_2 === "*")) ? true : (op_2 === "/")) ? true : (op_2 === "^"))) {
                    matchResult = 4;
                    op_3 = msg;
                }
                else {
                    matchResult = 7;
                }
        }
        switch (matchResult) {
            case 0:
                return initialState;
            case 1:
                if ((state.Display === "ERROR") ? true : (state.Display.length <= 1)) {
                    return new State("0", state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                }
                else {
                    return new State(substring(state.Display, 0, state.Display.length - 1), state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                }
            case 2: {
                const isFresh = ((state.Display === "0") ? true : (state.Display === "ERROR")) ? true : state.ClearDisplayOnNext;
                if (!isFresh && (state.Display.length >= 12)) {
                    return state;
                }
                else {
                    const newDisplay = isFresh ? digit_4 : (state.Display + digit_4);
                    return new State(newDisplay, state.StoredValue, state.PendingOp, false, state.IsExploded, state.IsArming);
                }
            }
            case 3: {
                const isFresh_1 = (state.Display === "ERROR") ? true : state.ClearDisplayOnNext;
                if (isFresh_1) {
                    return new State("0.", state.StoredValue, state.PendingOp, false, state.IsExploded, state.IsArming);
                }
                else if ((state.Display.indexOf(".") >= 0) ? true : (state.Display.length >= 11)) {
                    return state;
                }
                else {
                    return new State(state.Display + ".", state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                }
            }
            case 4:
                if (state.Display === "ERROR") {
                    return state;
                }
                else {
                    try {
                        const current = parse(state.Display);
                        return new State(op_3, current, op_3, true, state.IsExploded, state.IsArming);
                    }
                    catch (matchValue) {
                        return new State("ERROR", state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                    }
                }
            case 5:
                if (state.Display === "ERROR") {
                    return state;
                }
                else {
                    try {
                        const current_1 = parse(state.Display);
                        if (current_1 < 0) {
                            return new State("ERROR", state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                        }
                        else {
                            const res = Math.sqrt(current_1);
                            return new State(formatDisplay(res), state.StoredValue, state.PendingOp, true, state.IsExploded, state.IsArming);
                        }
                    }
                    catch (matchValue_1) {
                        return new State("ERROR", state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                    }
                }
            case 6: {
                const matchValue_2 = state.StoredValue;
                const matchValue_3 = state.PendingOp;
                let matchResult_1, op_4, v1;
                if (matchValue_2 != null) {
                    if (matchValue_3 != null) {
                        matchResult_1 = 0;
                        op_4 = matchValue_3;
                        v1 = matchValue_2;
                    }
                    else {
                        matchResult_1 = 1;
                    }
                }
                else {
                    matchResult_1 = 1;
                }
                switch (matchResult_1) {
                    case 0:
                        if (state.Display === "ERROR") {
                            return state;
                        }
                        else {
                            try {
                                const v2 = parse(state.Display);
                                const result = calculate(v1, v2, op_4);
                                return new State(formatDisplay(result), undefined, undefined, true, state.IsExploded, state.IsArming);
                            }
                            catch (matchValue_5) {
                                return new State("ERROR", state.StoredValue, state.PendingOp, state.ClearDisplayOnNext, state.IsExploded, state.IsArming);
                            }
                        }
                    default:
                        return state;
                }
            }
            default:
                return state;
        }
    }
}

export function press(k) {
    currentState(update(toString(k), currentState()));
    render();
}

export function flipSwitch(isOn) {
    if (isOn) {
        if (currentState().Display.trim() === "7355608") {
            currentState(new State(currentState().Display, currentState().StoredValue, currentState().PendingOp, currentState().ClearDisplayOnNext, currentState().IsExploded, true));
            render();
            startCountdown();
        }
        else {
            currentState(new State("ERROR", currentState().StoredValue, currentState().PendingOp, currentState().ClearDisplayOnNext, currentState().IsExploded, currentState().IsArming));
            render();
            window.setTimeout((_arg) => {
                resetSwitchUI();
            }, 1000);
        }
    }
    else if (!currentState().IsExploded) {
        currentState(new State(initialState.Display, initialState.StoredValue, initialState.PendingOp, initialState.ClearDisplayOnNext, initialState.IsExploded, false));
        render();
    }
}

window.press = ((k) => {
    press(k);
});

window.flipSwitch = ((isOn) => {
    flipSwitch(isOn);
});

render();

