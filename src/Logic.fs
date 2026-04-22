module Logic

open System
open Browser.Dom
open Fable.Core.JsInterop

type State = {
    Display: string
    Armed: bool
    Memory: float option
    Op: (float -> float -> float option) option
}

let initialState = { Display = "LOCKED"; Armed = false; Memory = None; Op = None }

let divide x y = if y <> 0.0 then Some(x / y) else None
let power x y = Some(Math.Pow(x, y))

let update (msg: string) (state: State) =
    if not state.Armed then
        match msg with
        | "SWITCH_ON" -> { state with Display = "ARMING..." }
        | "ARM_SUCCESS" -> { state with Armed = true; Display = "0" }
        | _ -> state // Игнорируем кнопки
    else
        match msg with
        | "C" -> { initialState with Armed = true; Display = "0" }
        | "=" -> 
            match state.Memory, state.Op with
            | Some m, Some f -> 
                let res = f m (float state.Display)
                { state with Display = match res with Some v -> string v | None -> "NaN"; Memory = None; Op = None }
            | _ -> state
        | "sqrt" -> { state with Display = string (Math.Sqrt(float state.Display)) }
        | "sin" -> { state with Display = string (Math.Sin(float state.Display)) }
        | op when ["+";"-";"*";"/";"^"] |> List.contains op ->
            let f = match op with "+"->(fun x y -> Some(x+y)) | "-"->(fun x y -> Some(x-y)) | "*"->(fun x y -> Some(x*y)) | "/"->divide | "^"->power | _->(fun _ _ -> None)
            { state with Memory = Some (float state.Display); Op = Some f; Display = "" }
        | digit -> 
            let cur = if state.Display = "0" || state.Display = "READY" then "" else state.Display
            { state with Display = cur + digit }

let mutable state = initialState

let render () =
    let display = document.getElementById("display")
    display.innerText <- state.Display
    
    let redLed = document.getElementById("red-led")
    if state.Armed then redLed.classList.add("active") else redLed.classList.remove("active")

let press (key: string) =
    try
        state <- update key state
        render()
    with _ -> 
        state <- { state with Display = "ERROR" }
        render()

let flipSwitch (isOn: bool) =
    if isOn then
        state <- update "SWITCH_ON" state
        render()
        window.setTimeout((fun _ -> 
            state <- update "ARM_SUCCESS" state
            render()), 5000) |> ignore
    else
        state <- update "SWITCH_OFF" state
        render()

// ЭКСПОРТ В GLOBAL WINDOW ДЛЯ HTML
window?press <- press
window?flipSwitch <- flipSwitch
render()