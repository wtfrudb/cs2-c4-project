
import { toString, Record } from "./fable_modules/fable-library-js.5.0.0/Types.js";
import { record_type, bool_type, string_type } from "./fable_modules/fable-library-js.5.0.0/Reflection.js";
import { createAtom } from "./fable_modules/fable-library-js.5.0.0/Util.js";
import { Operators_IsNull } from "./fable_modules/fable-library-js.5.0.0/FSharp.Core.js";
import { substring, printf, toText } from "./fable_modules/fable-library-js.5.0.0/String.js";
import { isDigit } from "./fable_modules/fable-library-js.5.0.0/Char.js";

export class State extends Record {
    constructor(Display, IsExploded, IsArming) {
        super();
        this.Display = Display;
        this.IsExploded = IsExploded;
        this.IsArming = IsArming;
    }
}

export function State_$reflection() {
    return record_type("Logic.State", [], State, () => [["Display", string_type], ["IsExploded", bool_type], ["IsArming", bool_type]]);
}

export const initialState = new State("0", false, false);

export let currentState = createAtom(initialState);

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
            currentState(new State((arg = (count | 0), toText(printf("00:0%d"))(arg)), currentState().IsExploded, currentState().IsArming));
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
            currentState(new State("BOOM", true, false));
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
    let digit;
    if (state.IsExploded ? true : state.IsArming) {
        return state;
    }
    else {
        switch (msg) {
            case "C":
                return initialState;
            case "DEL":
                if ((state.Display === "ERROR") ? true : (state.Display === "LOCKED")) {
                    return initialState;
                }
                else {
                    const d = (state.Display.length <= 1) ? "0" : substring(state.Display, 0, state.Display.length - 1);
                    return new State(d, state.IsExploded, state.IsArming);
                }
            default:
                if ((digit = msg, (digit.length === 1) && isDigit(digit[0]))) {
                    const digit_1 = msg;
                    const isFresh = ((state.Display === "0") ? true : (state.Display === "ERROR")) ? true : (state.Display === "LOCKED");
                    const newDisplay = isFresh ? digit_1 : (state.Display + digit_1);
                    if (newDisplay.length <= 12) {
                        return new State(newDisplay, state.IsExploded, state.IsArming);
                    }
                    else {
                        return state;
                    }
                }
                else {
                    return state;
                }
        }
    }
}

export function press(k) {
    currentState(update(toString(k), currentState()));
    render();
}

export function flipSwitch(isOn) {
    const active = isOn;
    if (active) {
        if (currentState().Display.trim() === "7355608") {
            currentState(new State(currentState().Display, currentState().IsExploded, true));
            render();
            startCountdown();
        }
        else {
            currentState(new State("ERROR", currentState().IsExploded, currentState().IsArming));
            render();
            window.setTimeout((_arg) => {
                resetSwitchUI();
            }, 1000);
        }
    }
    else if (!currentState().IsExploded) {
        currentState(new State(initialState.Display, initialState.IsExploded, false));
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

