module Logic

open System
open Browser.Dom
open Browser.Types
open Fable.Core.JsInterop

type State = {
    Display: string
    StoredValue: float option
    PendingOp: string option
    ClearDisplayOnNext: bool
    IsExploded: bool
    IsArming: bool
}

let initialState = { 
    Display = "0"
    StoredValue = None
    PendingOp = None
    ClearDisplayOnNext = false
    IsExploded = false
    IsArming = false
}

let mutable currentState = initialState

// --- Утилиты ---


let formatDisplay (n: float) =
    if Double.IsNaN(n) || Double.IsInfinity(n) then 
        "ERROR"
    else
        let s = n.ToString()
        let maxLength = 12

        if s.Length > maxLength then
            // Если это очень большое или очень маленькое число (уже с буквой 'e')
            // Или просто длинное целое/дробное
            let exp: string = n?toExponential(5) // Сначала пробуем стандарт
            
            if exp.Length > maxLength then
                // Если даже с 5 знаками не влезло, пробуем максимально сжать
                // Вычисляем точность динамически: 
                // Общая длина (12) - минус(1?) - первая цифра(1) - точка(1) - e+XX(4) 
                // Остается примерно 5 знаков.
                let dynamicExp: string = n?toExponential(3)
                if dynamicExp.Length > maxLength then dynamicExp.Substring(0, maxLength)
                else dynamicExp
            else
                exp
        else 
            s

let calculate v1 v2 op =
    match op with
    | "+" -> v1 + v2
    | "-" -> v1 - v2
    | "*" -> v1 * v2
    | "/" -> if v2 = 0.0 then Double.NaN else v1 / v2
    | "^" -> Math.Pow(v1, v2)
    | _ -> v2

let resetSwitchUI () =
    let checkbox = document.querySelector(".rocker input")
    if not (isNull checkbox) then
        (checkbox :?> HTMLInputElement)?checked <- false

let render () =
    let display = document.getElementById("display")
    if not (isNull display) then display?innerText <- currentState.Display
    
    let ledR = document.getElementById("red-led")
    if not (isNull ledR) then
        if currentState.IsArming && not currentState.IsExploded then
            ledR?classList?add("arming")
        else
            ledR?classList?remove("arming")
            ledR?style?removeProperty("--blink-speed") |> ignore

    let ledY = document.querySelector(".led-y")
    if not (isNull ledY) then
        if currentState.IsArming || currentState.IsExploded then
            ledY?style?opacity <- "0.1"
            ledY?style?boxShadow <- "none"
        else
            ledY?style?opacity <- "1"
            ledY?style?boxShadow <- "0 0 10px #ffff00"

    let body = document.querySelector("body")
    if not (isNull body) then
        if currentState.IsExploded then body?classList?add("boom")
        else body?classList?remove("boom")

// --- Логика Таймера ---

let startCountdown () =
    let mutable count = 5
    let rec tick () =
        if not currentState.IsArming || currentState.IsExploded then ()
        else
            if count >= 0 then
                currentState <- { currentState with Display = sprintf "00:0%d" count }
                render() 
                let ledElement = document.getElementById("red-led")
                if not (isNull ledElement) then
                    let speed = match count with 5->"0.8s"|4->"0.6s"|3->"0.4s"|2->"0.2s"|1->"0.1s"|_->"0.05s"
                    ledElement?style?setProperty("--blink-speed", speed)
                count <- count - 1
                window.setTimeout(tick, 1000) |> ignore
            else
                currentState <- { currentState with IsExploded = true; Display = "BOOM"; IsArming = false }
                render()
                window.setTimeout((fun _ -> 
                    resetSwitchUI()
                    currentState <- initialState
                    render()
                ), 5000) |> ignore
    tick ()

// --- Обновленное Ядро Калькулятора ---

let update (msg: string) (state: State) =
    if state.IsExploded || state.IsArming then state 
    else
        match msg with
        | "C" -> initialState
        
        | "DEL" ->
            if state.Display = "ERROR" || state.Display.Length <= 1 
            then { state with Display = "0" }
            else { state with Display = state.Display.Substring(0, state.Display.Length - 1) }

        | digit when (digit.Length = 1 && Char.IsDigit(digit.[0])) ->
            let isFresh = state.Display = "0" || state.Display = "ERROR" || state.ClearDisplayOnNext
            if not isFresh && state.Display.Length >= 12 then state
            else
                let newDisplay = if isFresh then digit else state.Display + digit
                { state with Display = newDisplay; ClearDisplayOnNext = false }

        | "." ->
            let isFresh = state.Display = "ERROR" || state.ClearDisplayOnNext
            if isFresh then { state with Display = "0."; ClearDisplayOnNext = false }
            elif state.Display.Contains(".") || state.Display.Length >= 11 then state
            else { state with Display = state.Display + "." }

        | op when (op = "+" || op = "-" || op = "*" || op = "/" || op = "^") ->
            if state.Display = "ERROR" then state
            else
                try
                    let current = float state.Display
                    { state with 
                        Display = op
                        StoredValue = Some current
                        PendingOp = Some op
                        ClearDisplayOnNext = true }
                with _ -> { state with Display = "ERROR" }

        | "sqrt" ->
            if state.Display = "ERROR" then state
            else
                try
                    let current = float state.Display
                    if current < 0.0 then 
                        { state with Display = "ERROR" }
                    else 
                        // Сразу форматируем результат извлечения корня
                        let res = Math.Sqrt(current)
                        { state with Display = formatDisplay res; ClearDisplayOnNext = true }
                with _ -> { state with Display = "ERROR" }

        | "=" ->
            match state.StoredValue, state.PendingOp with
            | Some v1, Some op ->
                if state.Display = "ERROR" then state
                else
                    try
                        let v2 = float state.Display
                        let result = calculate v1 v2 op
                        { state with 
                            Display = formatDisplay result
                            StoredValue = None
                            PendingOp = None
                            ClearDisplayOnNext = true }
                    with _ -> { state with Display = "ERROR" }
            | _ -> state

        | _ -> state

// --- Функции экспорта ---

let press (k: obj) =
    currentState <- update (string k) currentState
    render()

let flipSwitch (isOn: obj) =
    if !!isOn then
        if currentState.Display.Trim() = "7355608" then
            currentState <- { currentState with IsArming = true }
            render()
            startCountdown()
        else
            currentState <- { currentState with Display = "ERROR" }
            render()
            window.setTimeout((fun _ -> resetSwitchUI()), 1000) |> ignore
    else
        if not currentState.IsExploded then
            currentState <- { initialState with IsArming = false }
            render()

window?press <- press
window?flipSwitch <- flipSwitch
render()