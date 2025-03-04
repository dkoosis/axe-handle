// Path: src/examples/resultUtilsExamples.ts
// Examples demonstrating the usage of Result-based error handling.

import { AxeResult, AxeResultAsync, okResult, runOperation, runAsyncOperation, combineResults } from '../utils/resultUtils';
import { createGeneratorError } from '../utils/errorUtils';
//import { LogCategory } from '../utils/logger';

/**
 * Example function that may succeed or fail.
 * @param shouldSucceed Whether the function should succeed
 * @returns A number or throws an error
 */
function maybeFailSync(shouldSucceed: boolean): number {
  if (shouldSucceed) {
    return 42;
  }
  throw createGeneratorError(100, 'Something went wrong', { shouldSucceed });
}

/**
 * Example async function that may succeed or fail.
 * @param shouldSucceed Whether the function should succeed
 * @returns A promise that resolves to a number or rejects with an error
 */
async function maybeFailAsync(shouldSucceed: boolean): Promise<number> {
  if (shouldSucceed) {
    return 42;
  }
  throw createGeneratorError(101, 'Something went wrong asynchronously', { shouldSucceed });
}

/**
 * Example using the Result pattern to handle errors.
 * This approach avoids try/catch blocks and provides better type safety.
 */
function exampleWithResult(shouldSucceed: boolean): AxeResult<number> {
  return runOperation(
    () => {
      return maybeFailSync(shouldSucceed);
    },
    'exampleWithResult',
    102
  );
}

/**
 * Example using the ResultAsync pattern to handle async errors.
 * This approach avoids try/catch blocks and provides better type safety.
 */
function exampleWithResultAsync(shouldSucceed: boolean): AxeResultAsync<number> {
  return runAsyncOperation(
    () => maybeFailAsync(shouldSucceed),
    'exampleWithResultAsync',
    103
  );
}

/**
 * Example of working with multiple results.
 * @returns A result containing an array of numbers or an error
 */
function exampleCombiningResults(): AxeResult<number[]> {
  const result1 = exampleWithResult(true);
  const result2 = exampleWithResult(true);
  const result3 = exampleWithResult(false); // This one will fail
  
  return combineResults([result1, result2, result3]);
}

/**
 * Example of chaining results.
 * @returns A result containing a string or an error
 */
function exampleChainingResults(): AxeResult<string> {
  return exampleWithResult(true)
    .map(num => num * 2)
    .map(num => `The number is ${num}`);
}

/**
 * Example of handling errors in a functional way.
 * @returns A result containing a number or an error
 */
function exampleHandlingErrors(): AxeResult<number> {
  return exampleWithResult(false)
    .mapErr(error => {
      console.error('Handling error:', error.message);
      return createGeneratorError(104, 'Enhanced error message', { originalError: error.message }, error);
    })
    .orElse(_ => okResult(0)); // Provide a default value on error
}

/**
 * Example of proper error handling in an async context.
 */
async function demonstrateAsyncErrorHandling(): Promise<void> {
  // The Result approach - no try/catch needed
  const result = await exampleWithResultAsync(false);
  
  // Handle the result
  result.match(
    value => console.log('Success:', value),
    error => console.error('Error handled gracefully:', error.message)
  );
  
  // Standard approach with try/catch - more verbose and error-prone
  try {
    const value = await maybeFailAsync(false);
    console.log('Success:', value);
  } catch (error) {
    console.error('Caught error:', error);
  }
}

/**
 * Run the examples.
 */
async function runExamples(): Promise<void> {
  console.log('Running Result examples...');
  
  // Successful result
  const successResult = exampleWithResult(true);
  successResult.match(
    value => console.log('Success result:', value),
    error => console.error('Error (should not happen):', error.message)
  );
  
  // Error result
  const errorResult = exampleWithResult(false);
  errorResult.match(
    value => console.log('Success (should not happen):', value),
    error => console.error('Error result:', error.message)
  );
  
  // Combined results
  const combinedResult = exampleCombiningResults();
  combinedResult.match(
    values => console.log('Combined values (should not happen):', values),
    error => console.error('Combined error:', error.message)
  );
  
  // Chained results
  const chainedResult = exampleChainingResults();
  chainedResult.match(
    value => console.log('Chained result:', value),
    error => console.error('Chained error (should not happen):', error.message)
  );
  
  // Error handling
  const handledError = exampleHandlingErrors();
  handledError.match(
    value => console.log('Handled value:', value),
    error => console.error('Handled error (should not happen):', error.message)
  );
  
  // Async error handling
  await demonstrateAsyncErrorHandling();
  
  console.log('Examples completed');
}

// Only run if executed directly
if (require.main === module) {
  runExamples().catch(error => console.error('Uncaught error:', error));
}