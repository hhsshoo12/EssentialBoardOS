import { useState, useEffect, useCallback } from 'react'
import './Calculator.css'

function Calculator() {
    const [display, setDisplay] = useState('0')
    const [expression, setExpression] = useState('')
    const [waitingForOperand, setWaitingForOperand] = useState(false)
    const [operator, setOperator] = useState(null)
    const [prevValue, setPrevValue] = useState(null)

    const inputDigit = useCallback((digit) => {
        if (waitingForOperand) {
            setDisplay(String(digit))
            setWaitingForOperand(false)
        } else {
            setDisplay(prev => prev === '0' ? String(digit) : prev + digit)
        }
    }, [waitingForOperand])

    const inputDot = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.')
            setWaitingForOperand(false)
            return
        }
        if (!display.includes('.')) {
            setDisplay(prev => prev + '.')
        }
    }, [waitingForOperand, display])

    const clear = useCallback(() => {
        setDisplay('0')
        setExpression('')
        setOperator(null)
        setPrevValue(null)
        setWaitingForOperand(false)
    }, [])

    const toggleSign = useCallback(() => {
        setDisplay(prev => {
            const val = parseFloat(prev)
            return String(val * -1)
        })
    }, [])

    const inputPercent = useCallback(() => {
        setDisplay(prev => String(parseFloat(prev) / 100))
    }, [])

    const calculate = useCallback((left, right, op) => {
        switch (op) {
            case '+': return left + right
            case '-': return left - right
            case '×': return left * right
            case '÷': return right !== 0 ? left / right : 'Error'
            default: return right
        }
    }, [])

    const performOperation = useCallback((nextOp) => {
        const current = parseFloat(display)

        if (prevValue === null) {
            setPrevValue(current)
            setExpression(`${display} ${nextOp}`)
        } else if (operator) {
            const result = calculate(prevValue, current, operator)
            if (result === 'Error') {
                setDisplay('Error')
                setExpression('')
                setPrevValue(null)
                setOperator(null)
                setWaitingForOperand(false)
                return
            }
            const resultStr = parseFloat(result.toFixed(10)).toString()
            setDisplay(resultStr)
            setPrevValue(result)
            setExpression(`${resultStr} ${nextOp}`)
        }

        setOperator(nextOp)
        setWaitingForOperand(true)
    }, [display, prevValue, operator, calculate])

    const handleEquals = useCallback(() => {
        if (operator === null || prevValue === null) return
        const current = parseFloat(display)
        const result = calculate(prevValue, current, operator)
        if (result === 'Error') {
            setDisplay('Error')
        } else {
            const resultStr = parseFloat(result.toFixed(10)).toString()
            setDisplay(resultStr)
            setExpression(`${prevValue} ${operator} ${current} =`)
        }
        setPrevValue(null)
        setOperator(null)
        setWaitingForOperand(true)
    }, [display, prevValue, operator, calculate])

    /* ── Keyboard Support ── */
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key >= '0' && e.key <= '9') inputDigit(parseInt(e.key))
            else if (e.key === '.') inputDot()
            else if (e.key === '+') performOperation('+')
            else if (e.key === '-') performOperation('-')
            else if (e.key === '*') performOperation('×')
            else if (e.key === '/') { e.preventDefault(); performOperation('÷') }
            else if (e.key === 'Enter' || e.key === '=') handleEquals()
            else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') clear()
            else if (e.key === '%') inputPercent()
            else if (e.key === 'Backspace') {
                setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [inputDigit, inputDot, performOperation, handleEquals, clear, inputPercent])

    const formatDisplay = (val) => {
        if (val === 'Error') return val
        const num = parseFloat(val)
        if (isNaN(num)) return '0'
        if (val.endsWith('.') || val.endsWith('.0')) return val
        if (Math.abs(num) >= 1e12) return num.toExponential(4)
        return val
    }

    return (
        <div className="calculator">
            <div className="calculator-body">
                <div className="calc-display">
                    <div className="calc-expression">{expression}</div>
                    <div className="calc-result">{formatDisplay(display)}</div>
                </div>
                <div className="calc-keypad">
                    <button className="calc-key fn" onClick={clear}>C</button>
                    <button className="calc-key fn" onClick={toggleSign}>±</button>
                    <button className="calc-key fn" onClick={inputPercent}>%</button>
                    <button className="calc-key op" onClick={() => performOperation('÷')}>÷</button>

                    <button className="calc-key num" onClick={() => inputDigit(7)}>7</button>
                    <button className="calc-key num" onClick={() => inputDigit(8)}>8</button>
                    <button className="calc-key num" onClick={() => inputDigit(9)}>9</button>
                    <button className="calc-key op" onClick={() => performOperation('×')}>×</button>

                    <button className="calc-key num" onClick={() => inputDigit(4)}>4</button>
                    <button className="calc-key num" onClick={() => inputDigit(5)}>5</button>
                    <button className="calc-key num" onClick={() => inputDigit(6)}>6</button>
                    <button className="calc-key op" onClick={() => performOperation('-')}>−</button>

                    <button className="calc-key num" onClick={() => inputDigit(1)}>1</button>
                    <button className="calc-key num" onClick={() => inputDigit(2)}>2</button>
                    <button className="calc-key num" onClick={() => inputDigit(3)}>3</button>
                    <button className="calc-key op" onClick={() => performOperation('+')}>+</button>

                    <button className="calc-key num zero" onClick={() => inputDigit(0)}>0</button>
                    <button className="calc-key num" onClick={inputDot}>.</button>
                    <button className="calc-key eq" onClick={handleEquals}>=</button>
                </div>
            </div>
        </div>
    )
}

export default Calculator
