// Path: src/examples/resultExample.ts
// Example of using the Result pattern with neverthrow

import { AxeResult, AxeResultAsync, okResult, errResult, runOperation, runAsyncOperation } from '../utils/resultUtils';
import { createGeneratorError } from '../utils/errorUtils';

/**
 * Example function returning a Result
 */
function divide(a: number, b: number): AxeResult<number> {
  if (b === 0) {
    return errResult(createGeneratorError(
      1000,
      'Division by zero',
      { a, b }
    ));
  }
  return okResult(a / b);
}

/**
 * Example function using the runOperation helper
 */
function safeDivide(a: number, b: number): AxeResult<number> {
  return runOperation(
    () => {
      if (b === 0) {
        throw new Error('Division by zero');
      }
      return a / b;
    },
    'divide',
    1001
  );
}

/**
 * Example function using async operations
 */
async function fetchData(url: string): Promise<AxeResultAsync<any>> {
  return runAsyncOperation(
    async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return await response.json();
    },
    'fetchData',
    2001
  );
}

/**
 * Example of chaining Result operations
 */
function complexCalculation(a: number, b: number, c: number): AxeResult<number> {
  return divide(a, b)
    .andThen(result => divide(result, c))
    .map(result => result * 100);
}

/**
 * Example of handling Results with match
 */
function handleResult(result: AxeResult<number>): string {
  return result.match(
    (value) => `Success: ${value}`,
    (error) => `Error: ${error.code} - ${error.message}`
  );
}

/**
 * Example usage
 */
async function runExamples(): Promise<void> {
  // Basic result
  const result1 = divide(10, 2);
  console.log('Result 1:', handleResult(result1));
  
  const result2 = divide(10, 0);
  console.log('Result 2:', handleResult(result2));
  
  // Using runOperation
  const result3 = safeDivide(10, 2);
  console.log('Result 3:', handleResult(result3));
  
  // Complex chaining
  const result4 = complexCalculation(10, 2, 5);
  console.log('Result 4:', handleResult(result4));
  
  // Async operation
  try {
    const dataResult = await fetchData('https://jsonplaceholder.typicode.com/todos/1');
    dataResult.match(
      (data) => console.log('Data:', data),
      (error) => console.error('Error:', error.code, error.message)
    );
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Run the examples
if (require.main === module) {
  runExamples().catch(console.error);
}
