module Logic

open System
open Browser.Dom
open Browser.Types
open Fable.Core.JsInterop

type State = {
    Display: string
    IsExploded: bool
    IsArming: bool
}

let initialState = { 
    Display = "0"
    IsExploded = false
    IsArming = false
}

let mutable currentState = initialState

// --- Безопасные утилиты отрисовки ---

let resetSwitchUI () =
    let checkbox = document.querySelector(".rocker input")
    if not (isNull checkbox) then
        (checkbox :?> HTMLInputElement)?checked <- false

let render () =
    // Используем динамический доступ '?', чтобы избежать ошибок типов при поиске элементов
    let display = document.getElementById("display")
    if not (isNull display) then
        display?innerText <- currentState.Display
    
    let ledR = document.getElementById("red-led")
    if not (isNull ledR) then
        if currentState.IsArming && not currentState.IsExploded then
            ledR?classList?add("arming")
        else
            ledR?classList?remove("arming")
            ledR?style?removeProperty("--blink-speed") |> ignore
    
    let body = document.querySelector("body")
    if not (isNull body) then
        if currentState.IsExploded then body?classList?add("boom")
        else body?classList?remove("boom")

// --- Логика Таймера ---

let startCountdown () =
    let mutable count = 5
    
    let rec tick () =
        // Если тумблер выключили или уже бабахнуло — выходим из цикла
        if not currentState.IsArming || currentState.IsExploded then ()
        else
            if count >= 0 then
                // 1. Сначала обновляем состояние цифр
                currentState <- { currentState with Display = sprintf "00:0%d" count }
                render() 
                
                // 2. Безопасно пробуем обновить скорость мигания
                let ledElement = document.getElementById("red-led")
                if not (isNull ledElement) then
                    let speed = 
                        match count with
                        | 5 -> "0.8s" | 4 -> "0.6s" | 3 -> "0.4s"
                        | 2 -> "0.2s" | 1 -> "0.1s" | _ -> "0.05s"
                    ledElement?style?setProperty("--blink-speed", speed)

                count <- count - 1
                // 3. ПЛАНИРУЕМ СЛЕДУЮЩИЙ ШАГ (в самом конце, чтобы всё выше успело отработать)
                window.setTimeout(tick, 1000) |> ignore
                
            else
                // ФИНАЛ: ВЗРЫВ
                currentState <- { currentState with IsExploded = true; Display = "BOOM"; IsArming = false }
                render()
                // Сброс всей системы через 5 секунд после взрыва
                window.setTimeout((fun _ -> 
                    resetSwitchUI()
                    currentState <- initialState
                    render()
                ), 5000) |> ignore
            
    tick ()

// --- Логика Калькулятора ---

let update (msg: string) (state: State) =
    if state.IsExploded || state.IsArming then state 
    else
        match msg with
        | "C" -> initialState
        | "DEL" ->
            if state.Display = "ERROR" || state.Display = "LOCKED" then initialState
            else
                let d = if state.Display.Length <= 1 then "0" else state.Display.Substring(0, state.Display.Length - 1)
                { state with Display = d }
        | digit when (digit.Length = 1 && Char.IsDigit(digit.[0])) ->
            let isFresh = state.Display = "0" || state.Display = "ERROR" || state.Display = "LOCKED"
            let newDisplay = if isFresh then digit else state.Display + digit
            if newDisplay.Length <= 12 then { state with Display = newDisplay } else state
        | _ -> state

// --- Функции экспорта для HTML ---

let press (k: obj) =
    currentState <- update (string k) currentState
    render()

let flipSwitch (isOn: obj) =
    let active = !!isOn 
    if active then
        // Проверка секретного кода
        if currentState.Display.Trim() = "7355608" then
            currentState <- { currentState with IsArming = true }
            render()
            startCountdown()
        else
            currentState <- { currentState with Display = "ERROR" }
            render()
            // Авто-отщелкивание тумблера при ошибке
            window.setTimeout((fun _ -> resetSwitchUI()), 1000) |> ignore
    else
        // Если игрок сам выключил тумблер до взрыва
        if not currentState.IsExploded then
            currentState <- { initialState with IsArming = false }
            render()

// Привязка функций к глобальному объекту window
window?press <- press
window?flipSwitch <- flipSwitch

// Первый запуск для очистки интерфейса
render()