'use client';

import { useState } from 'react';
import Modal from './Modal';

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculatorModal({ isOpen, onClose }: CalculatorModalProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNewValue(true);
    }
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const formatDisplay = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    
    // Format large numbers with commas
    if (num >= 1000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 8 });
    }
    
    // For decimal numbers, limit to 8 decimal places
    return num.toString();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calculator"
    >
      {(closeModal) => (
        <div className="w-full max-w-sm mx-auto">
          {/* Display */}
          <div className="mb-4 p-4 bg-muted rounded-lg text-right">
            <div className="text-2xl font-mono text-foreground overflow-hidden">
              {formatDisplay(display)}
            </div>
          </div>

          {/* Calculator Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <button
              onClick={clear}
              className="col-span-2 px-4 py-3 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors cursor-pointer font-medium"
            >
              Clear
            </button>
            <button
              onClick={handleBackspace}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              ⌫
            </button>
            <button
              onClick={() => performOperation('÷')}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              ÷
            </button>

            {/* Row 2 */}
            <button
              onClick={() => inputNumber('7')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              7
            </button>
            <button
              onClick={() => inputNumber('8')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              8
            </button>
            <button
              onClick={() => inputNumber('9')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              9
            </button>
            <button
              onClick={() => performOperation('×')}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              ×
            </button>

            {/* Row 3 */}
            <button
              onClick={() => inputNumber('4')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              4
            </button>
            <button
              onClick={() => inputNumber('5')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              5
            </button>
            <button
              onClick={() => inputNumber('6')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              6
            </button>
            <button
              onClick={() => performOperation('-')}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              -
            </button>

            {/* Row 4 */}
            <button
              onClick={() => inputNumber('1')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              1
            </button>
            <button
              onClick={() => inputNumber('2')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              2
            </button>
            <button
              onClick={() => inputNumber('3')}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              3
            </button>
            <button
              onClick={() => performOperation('+')}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              +
            </button>

            {/* Row 5 */}
            <button
              onClick={() => inputNumber('0')}
              className="col-span-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              0
            </button>
            <button
              onClick={inputDecimal}
              className="px-4 py-3 bg-secondary text-secondary-foreground rounded-md hover:bg-accent transition-colors cursor-pointer font-medium"
            >
              .
            </button>
            <button
              onClick={handleEquals}
              className="px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer font-medium"
            >
              =
            </button>
          </div>

          {/* Close Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
