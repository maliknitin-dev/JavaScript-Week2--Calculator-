/* =========================================================================
   script.js — the BRAIN of the calculator
   -------------------------------------------------------------------------
   This file contains ALL of the calculator's logic. The HTML provides the
   buttons and the CSS makes them pretty — but this file is what actually
   knows how to add, subtract, multiply and divide.

   HOW THE CALCULATOR REMEMBERS THINGS  (read this first, it makes the
   rest of the file much easier to follow)
   -------------------------------------------------------------------------
   1. "firstOperand"  — the number you typed BEFORE pressing an operator.
        Example: you press 8 then +  →  the value 8 is stored here.

   2. "operator"      — the operator you pressed last (+, -, * or /).
        It is NOT applied yet. It is "waiting" for the second number.

   3. "currentDisplay" — the TEXT shown on the big display right now.
        Remember: on the screen everything is a string like "7" or "3.5".

   4. "waitingForSecondOperand" — a true/false switch.
        Right after you press an operator it becomes true, which tells the
        calculator: "the next digit you type starts the SECOND number —
        start a fresh number instead of sticking it on the end of the
        first one."

   5. "justEvaluated" — another true/false switch.
        Right after you press = it becomes true, telling the calculator:
        "the answer is finished, so the next digit starts a brand new sum."
   ========================================================================= */

/* ---------- 1. THE STATE (the calculator's "memory") ---------- */

let firstOperand = null;               /* the first number (or null = none yet)      */
let operator = null;                   /* the waiting operator (or null = none yet)  */
let currentDisplay = "0";              /* the text on the big screen — starts as "0" */
let waitingForSecondOperand = false;   /* true right after an operator is pressed    */
let justEvaluated = false;             /* true right after = is pressed              */

/* The exact error message shown when someone tries to divide by zero.
   Stored in a constant so the rest of the code can compare against it
   without worrying about typos. */
const ERROR_MESSAGE = "Cannot divide by 0";

/* ---------- 2. GRABBING THE DISPLAY ELEMENTS ----------
   id comes from the HTML: id="main-display" and id="history-line".
   These two variables now point AT those <div>s, so we can read and
   change their text from JavaScript. */
const mainDisplay = document.getElementById("main-display");
const historyLine = document.getElementById("history-line");

/* =========================================================================
   FUNCTION: formatNumber
   -------------------------------------------------------------------------
   Turns a raw JavaScript number into a clean string for the screen.
   It fixes two classic calculator annoyances:
     • Floating-point sloppiness:  0.1 + 0.2 can come out as
       0.30000000000000004 in a computer. Rounding to 10 decimal places
       makes it 0.3.
     • Division by zero: the result is "NaN" (Not a Number), which is
       meaningless to a human, so we show a friendly message instead.
   -------------------------------------------------------------------------
   value — the raw number to format (e.g. 0.30000000000000004)
   RETURNS — a string, e.g. "0.3"
   ========================================================================= */
function formatNumber(value) {
    /* Number.isFinite returns false for NaN (0/0), Infinity (1/0) etc. */
    if (!Number.isFinite(value)) {
        return ERROR_MESSAGE;
    }

    /* Round to 10 decimal places using a maths trick:
       value * 1e10 pushes the decimal point 10 places right,
       Math.round snaps it to a whole number, / 1e10 pushes it back. */
    const rounded = Math.round(value * 1e10) / 1e10;

    /* Turn the number into its normal text form. (Very huge numbers
       become scientific notation like 1e+21 automatically — fine.) */
    return String(rounded);
}

/* =========================================================================
   FUNCTION: operatorSymbol
   -------------------------------------------------------------------------
   The code stores operators as the plain ASCII symbols that JavaScript
   recognises for arithmetic: + - * /.
   The screen should show the prettier symbols ÷ × − instead. This small
   helper converts one into the other.
   -------------------------------------------------------------------------
   op — the internal operator, e.g. "*"
   RETURNS — the pretty symbol, e.g. "×"
   ========================================================================= */
function operatorSymbol(op) {
    if (op === "*") return "\u00D7";  /* × */
    if (op === "/") return "\u00F7";  /* ÷ */
    if (op === "-") return "\u2212";  /* − */
    return "+";
}

/* =========================================================================
   FUNCTION: updateHistoryLine
   -------------------------------------------------------------------------
   Puts helpful text in the small display line above the big number.
   Examples of what it shows while you work:
       you type  5     →  (blank line)
       you press +     →  "5 +"          (waiting for the 2nd number)
       you type  3     →  "5 + 3"        (you are building the 2nd number)
       you press =     →  "8 ="          (the finished sum)
   ========================================================================= */
function updateHistoryLine() {
    /* If the screen is showing an error, clear the history line so the
       error message is the only thing the user needs to read. */
    if (currentDisplay === ERROR_MESSAGE) {
        historyLine.textContent = "";
        return;
    }

    if (operator !== null) {
        /* The operator was pressed, so we know the first number.
           firstOperand is a number, so format it back into a string. */
        const first = formatNumber(firstOperand);
        const symbol = operatorSymbol(operator);

        if (waitingForSecondOperand) {
            /* User just pressed the operator: "5 +" */
            historyLine.textContent = first + " " + symbol;
        } else {
            /* User is typing the second number: "5 + 3" */
            historyLine.textContent = first + " " + symbol + " " + currentDisplay;
        }
    } else if (justEvaluated) {
        /* Equals was pressed and there is no operator left: "8 =" */
        historyLine.textContent = currentDisplay + " =";
    } else {
        /* Nothing pending at all → empty history line. */
        historyLine.textContent = "";
    }
}

/* =========================================================================
   FUNCTION: updateDisplay
   -------------------------------------------------------------------------
   Copies the current value of the "currentDisplay" variable onto the
   actual screen in the HTML, and refreshes the history line too.
   Every other function calls this after changing the state, so the
   screen is always kept in sync with what the calculator "knows".
   (Remember: variable → screen in ONE direction only. That is the rule.)
   ========================================================================= */
function updateDisplay() {
    mainDisplay.textContent = currentDisplay;
    updateHistoryLine();
}

/* =========================================================================
   FUNCTION: inputDigit
   -------------------------------------------------------------------------
   Called every time a number key (0-9) is pressed.
   Depending on the state, the digit either:
     • starts a brand-new number (if an operator was just pressed, or an
       answer was just shown), or
     • gets appended to the end of the number being typed.
   There is also a safety guard so the screen can't overflow with
   hundreds of digits.
   -------------------------------------------------------------------------
   digit — the text of the key that was pressed, e.g. "7"
   ========================================================================= */
function inputDigit(digit) {
    /* Case A: an operator was just pressed (or an answer was just shown).
       The digit must START a fresh number, not be glued to the old one. */
    if (waitingForSecondOperand || justEvaluated) {
        currentDisplay = digit;          /* screen becomes "7", replacing "5"  */
        waitingForSecondOperand = false; /* the operator no longer matters now */
        justEvaluated = false;           /* a new sum is being typed           */
    } else if (currentDisplay === "0") {
        /* Case B: screen still shows just "0" → replace it. This is how
           "0" + "7" becomes "7" instead of "07". */
        currentDisplay = digit;
    } else if (currentDisplay.length < 16) {
        /* Case C: normal typing → stick the digit on the end.
           length < 16 is the overflow guard: we refuse to let the
           number grow past 16 characters. */
        currentDisplay = currentDisplay + digit;
    }

    updateDisplay(); /* refresh the screen so the user sees the change */
}

/* =========================================================================
   FUNCTION: inputDecimal
   -------------------------------------------------------------------------
   Called when the "." key is pressed. Adds a decimal point to the number
   being typed, but only if the number doesn't already have one (you can't
   type 1.2.3). If an operator was just pressed, a fresh number "0." starts.
   ========================================================================= */
function inputDecimal() {
    /* If we are waiting for the second number (or an answer was shown),
       a "." means the new number is "0.something". */
    if (waitingForSecondOperand || justEvaluated) {
        currentDisplay = "0.";
        waitingForSecondOperand = false;
        justEvaluated = false;
        updateDisplay();
        return;
    }

    /* If "." already exists in the number on screen, do nothing. */
    if (!currentDisplay.includes(".")) {
        currentDisplay = currentDisplay + ".";
    }

    updateDisplay();
}

/* =========================================================================
   FUNCTION: performCalculation
   -------------------------------------------------------------------------
   The only place in the whole app that does real arithmetic.
   Given two numbers and an operator it returns the result.
   -------------------------------------------------------------------------
   a  — the first number  (e.g. 5)
   b  — the second number (e.g. 3)
   op — the internal operator symbol, one of: "+" "-" "*" "/"
   RETURNS — the answer as a number.
             Dividing by zero returns NaN (Not a Number) so the caller
             can display the friendly error message.
   ========================================================================= */
function performCalculation(a, b, op) {
    if (op === "+") return a + b;
    if (op === "-") return a - b;
    if (op === "*") return a * b;
    if (op === "/") {
        /* Dividing ANY number by zero is not allowed in maths. NaN is
           JavaScript's way of saying "this answer is not a real number". */
        if (b === 0) return Number.NaN;
        return a / b;
    }
    /* If we somehow get an unknown operator, just return the second
       number. This fallback stops the app from ever crashing. */
    return b;
}

/* =========================================================================
   FUNCTION: handleOperator
   -------------------------------------------------------------------------
   Called when an operator key ( +  −  ×  ÷ ) is pressed.
   The rules:
     • First operator pressed  → just REMEMBER the number on screen.
        e.g.  8  +  → firstOperand = 8, operator = "+"
     • Second operator pressed → finish the first sum first, then
        remember the result as the new first number.
        e.g.  8 + 5  ×  →  13 becomes firstOperand, then operator = "*"
          So "8 + 5 ×" behaves like "(8 + 5) × ..."  — this is standard
          simple-calculator behaviour (no multiplication precedence).
        This is also what lets you chain: 8 + 5 + 2 = 15.
   -------------------------------------------------------------------------
   nextOp — the internal operator symbol being pressed, e.g. "+"
   ========================================================================= */
function handleOperator(nextOp) {
    /* Safety net: if the screen shows the division-by-zero error,
       treat this operator press as a fresh start (reset to 0). */
    if (currentDisplay === ERROR_MESSAGE) {
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = false;
        justEvaluated = false;
        currentDisplay = "0";
    }

    /* Read the number currently on the screen as an actual number.
       parseFloat turns text like "3.5" into the number 3.5. */
    const inputValue = parseFloat(currentDisplay);

    /* Is there already a waiting operator AND a finished second number?
       Then it is time to do the maths for the PREVIOUS operator now. */
    if (operator !== null && !waitingForSecondOperand) {
        const result = performCalculation(firstOperand, inputValue, operator);
        firstOperand = result; /* the running total becomes the new first number */
        currentDisplay = formatNumber(result);
    } else {
        /* This is the very first operator pressed (or the second operator
           right after the first — e.g. pressing + then −). Just remember
           the number that is on screen. */
        firstOperand = inputValue;
    }

    /* Store the NEW operator and flip on the "waiting" switch, so the
       next digit the user types starts a fresh second number. */
    operator = nextOp;
    waitingForSecondOperand = true;
    justEvaluated = false;

    updateDisplay();
}

/* =========================================================================
   FUNCTION: evaluate
   -------------------------------------------------------------------------
   Called when the = key is pressed. Completes the waiting sum:
     "firstOperand  operator  (number on screen)"  →  answer
   Example: 5 + 3 =  →  firstOperand 5, operator +, screen "3" → 8
   Afterwards the operator is cleared so pressing = again does nothing
   (instead of repeating the sum forever).
   ========================================================================= */
function evaluate() {
    /* If no operator is waiting, pressing = has nothing to do. */
    if (operator === null) {
        return;
    }

    const inputValue = parseFloat(currentDisplay);
    const result = performCalculation(firstOperand, inputValue, operator);

    /* Show the answer (formatNumber turns NaN into the error message). */
    currentDisplay = formatNumber(result);

    /* Clear the pending state: the sum is DONE now. */
    operator = null;
    waitingForSecondOperand = false;
    justEvaluated = true; /* so the next digit starts a brand-new sum */

    updateDisplay();
}

/* =========================================================================
   FUNCTION: clearAll
   -------------------------------------------------------------------------
   The AC (All Clear) key. Resets EVERY piece of memory back to its
   starting value — like turning the calculator off and on again.
   ========================================================================= */
function clearAll() {
    firstOperand = null;
    operator = null;
    currentDisplay = "0";
    waitingForSecondOperand = false;
    justEvaluated = false;
    updateDisplay();
}

/* =========================================================================
   FUNCTION: backspace
   -------------------------------------------------------------------------
   The ⌫ key. Removes the LAST digit of the number being typed.
   If a second number was about to be typed (operator was just pressed),
   the screen just resets to "0" — the first number is already stored in
   memory and can't be edited from here.
   ========================================================================= */
function backspace() {
    if (waitingForSecondOperand || justEvaluated) {
        /* Nothing to delete yet → clear the screen back to 0. */
        currentDisplay = "0";
        waitingForSecondOperand = false;
        justEvaluated = false;
    } else {
        /* Remove the last character: "3.5" becomes "3." */
        currentDisplay = currentDisplay.slice(0, -1);

        /* If deleting leaves "", "." or "-" (no real number left),
           show 0 instead. */
        if (currentDisplay === "" || currentDisplay === "." || currentDisplay === "-") {
            currentDisplay = "0";
        }
    }
    updateDisplay();
}

/* =========================================================================
   FUNCTION: toggleSign
   -------------------------------------------------------------------------
   The ± key. Flips the number on screen between positive and negative.
   (0 stays 0 — there is no such thing as -0 in a hand-held calculator!)
   ========================================================================= */
function toggleSign() {
    const value = parseFloat(currentDisplay);

    if (value === 0) return; /* don't display "-0" */

    currentDisplay = formatNumber(-value);
    updateDisplay();
}

/* =========================================================================
   FUNCTION: percent
   -------------------------------------------------------------------------
   The % key. Simply divides the number on screen by 100:
   50 % → 0.5,  200 % → 2.
   (This is the simple, predictable behaviour; no hidden "of the first
   number" tricks.)
   ========================================================================= */
function percent() {
    const value = parseFloat(currentDisplay);
    currentDisplay = formatNumber(value / 100);
    updateDisplay();
}

/* =========================================================================
   3. WIRING THINGS UP — making the buttons actually DO things
   -------------------------------------------------------------------------
   Below we tell the browser: "when a button is clicked, call the right
   function". We find every button by its data-* attribute and attach a
   little "click listener" to each one.
   ========================================================================= */

/* --- digit & decimal keys: everything with a data-digit attribute --- */
document.querySelectorAll("[data-digit]").forEach(function (button) {
    button.addEventListener("click", function () {
        inputDigit(button.dataset.digit);
    });
});

/* --- operator keys: everything with a data-operator attribute --- */
document.querySelectorAll("[data-operator]").forEach(function (button) {
    button.addEventListener("click", function () {
        handleOperator(button.dataset.operator);
    });
});

/* --- special action keys: everything with a data-action attribute.
       We use a chain of if/else-if to decide which action to run. --- */
document.querySelectorAll("[data-action]").forEach(function (button) {
    button.addEventListener("click", function () {
        const action = button.dataset.action;

        if (action === "clear") {
            clearAll();
        } else if (action === "backspace") {
            backspace();
        } else if (action === "percent") {
            percent();
        } else if (action === "sign") {
            toggleSign();
        } else if (action === "equals") {
            evaluate();
        }
    });
});

/* =========================================================================
   4. KEYBOARD SUPPORT
   -------------------------------------------------------------------------
   The whole keypad is also usable from a real keyboard. We listen for
   key presses anywhere on the page and translate them into the same
   function calls as the buttons above.
   ========================================================================= */
document.addEventListener("keydown", function (event) {
    const key = event.key; /* which key was pressed, e.g. "7", "+", "Enter" */

    /* Number keys 0-9. The /^[0-9]$/ test is a regular expression
       meaning "exactly one digit character from 0 to 9". */
    if (/^[0-9]$/.test(key)) {
        inputDigit(key);
        return;
    }

    if (key === ".") {              /* the full-stop key         */
        inputDecimal();
        return;
    }
    if (key === "+") {              /* the + key                 */
        handleOperator("+");
        return;
    }
    if (key === "-") {              /* the minus key             */
        handleOperator("-");
        return;
    }
    if (key === "*" || key === "x" || key === "X") { /* × / x key  */
        handleOperator("*");
        return;
    }
    if (key === "/") {              /* the divide key            */
        /* preventDefault stops the browser's quick-find bar
           from opening when / is pressed. */
        event.preventDefault();
        handleOperator("/");
        return;
    }
    if (key === "Enter" || key === "=") { /* equals keys          */
        event.preventDefault();          /* stop Enter re-clicking a button */
        evaluate();
        return;
    }
    if (key === "Backspace") {      /* the delete key            */
        backspace();
        return;
    }
    if (key === "Escape") {         /* Escape resets everything  */
        clearAll();
        return;
    }
    if (key === "%") {              /* the percent key           */
        percent();
        return;
    }
});