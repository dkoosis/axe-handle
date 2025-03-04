# Neverthrow Integration for Axe Handle

This document explains how to use the neverthrow integration in Axe Handle for more robust error handling with the Result pattern.

## Overview

The neverthrow library provides a functional approach to error handling that:

1. Makes error handling explicit in type signatures
2. Forces you to handle both success and error cases
3. Improves code readability by eliminating cascading try/catch blocks
4. Provides a chainable API for transforming results

## Basic Usage

### Creating Results

```typescript
import { okResult, errResult, createGeneratorErrorResult } from './utils/resultUtils';

// Success case
const successResult = okResult<number>(42);

// Error case
const errorResult = createGeneratorErrorResult<number>(
  1001, 
  'Something went wrong',
  { context: 'some details' }
);
```

### Consuming Results

```typescript
// Using match to handle both success and error cases
result.match(
  // Success handler
  (value) => {
    console.log('Success:', value);
  },
  // Error handler
  (error) => {
    console.error('Error:', error.message);
  }
);

// Using unwrap (only if you're sure it's a success)
if (result.isOk()) {
  const value = result.unwrap();
  console.log('Value:', value);
}

// Providing a default value for errors
const valueOrDefault = result.unwrapOr(0);
```

### Transforming Results

```typescript
// Transforming success values
const transformedResult = result.map(value => value * 2);

// Transforming error values
const newErrorResult = result.mapErr(error => {
  // Add more context to the error
  return {
    ...error,
    message: `Enhanced: ${error.message}`,
    details: { ...error.details, additional: 'context' }
  };
});

// Chaining operations (only runs if previous result was successful)
const chainedResult = result
  .map(value => value * 2)
  .andThen(value => {
    if (value > 100) {
      return okResult(value);
    } else {
      return createGeneratorErrorResult(
        1002,
        'Value too small',
        { value }
      );
    }
  });
```

## Utilities

### Running Operations with Result Handling

```typescript
import { runOperation, runAsyncOperation } from './utils/resultUtils';
import { LogCategory } from './utils/logger';

// Synchronous operation
const result = runOperation(
  'operation-name',
  () => {
    // Your code here, can throw errors
    return 42;
  },
  LogCategory.GENERAL,
  1003 // Error code if the operation fails
);

// Asynchronous operation
const asyncResult = await runAsyncOperation(
  'async-operation-name',
  async () => {
    // Your async code here, can throw errors
    return 42;
  },
  LogCategory.GENERAL,
  1004 // Error code if the operation fails
);
```

### Combining Multiple Results

```typescript
import { combineResults } from './utils/resultUtils';

const result1 = okResult(1);
const result2 = okResult(2);
const result3 = okResult(3);

// Combines multiple results into a result containing an array
const combinedResult = combineResults([result1, result2, result3]);
// combinedResult is Ok([1, 2, 3])

// If any result is an error, the first error is returned
const result4 = createGeneratorErrorResult(1005, 'Error in result4');
const combinedWithError = combineResults([result1, result4, result3]);
// combinedWithError is Err(error from result4)
```

## Integration with Existing Code

### Converting to/from Promise-based Code

```typescript
import { resultToPromise, resultAsyncToPromise } from './utils/resultUtils';

// Convert a Result to a Promise
const promise = resultToPromise(result);

// Convert a ResultAsync to a Promise
const asyncPromise = await resultAsyncToPromise(asyncResult);
```

### Creating Result-based APIs

When creating new functions, consider offering both traditional and Result-based versions:

```typescript
// Traditional version (throws exceptions)
export function doSomething(): number {
  // Implementation
}

// Result-based version (returns Result)
export function doSomethingResult(): AxeResult<number> {
  return runOperation('doSomething', () => doSomething());
}
```

## Best Practices

1. **Be explicit in type signatures**: Always specify the success type parameter in `AxeResult<T>`.

2. **Handle both success and error cases**: Use `match()` to ensure you handle both outcomes.

3. **Avoid unwrapping unsafely**: Only use `unwrap()` when you're certain the result is a success.

4. **Chain operations**: Use `map()`, `mapErr()`, and `andThen()` to create clean pipelines.

5. **Keep error context**: When mapping errors, preserve or enhance the context rather than losing information.

6. **Use meaningful operation names**: When using `runOperation`, choose descriptive names that help with debugging.

7. **Consider result boundaries**: Convert to/from Results at API boundaries to maintain compatibility.

## Example: Template Engine

The TemplateEngine class demonstrates how to use the Result pattern effectively:

```typescript
// Using the Result-based API
const result = templateEngine.renderTemplate('template-name', data);

result.match(
  content => {
    console.log('Template rendered successfully');
    // Use content...
  },
  error => {
    console.error('Failed to render template:', error.message);
    // Handle error...
  }
);

// Using the traditional API (throws exceptions)
try {
  const content = templateEngine.renderToFileSync('template-name', 'output.txt', data);
  console.log('Template rendered successfully');
} catch (error) {
  console.error('Failed to render template:', error);
}
```

## Migration Strategy

When migrating existing code to use the Result pattern:

1. Start with new functionality or isolated modules
2. Create Result-based alternatives to existing functions
3. Update error handling in core code paths
4. Gradually replace try/catch blocks with Result operations
5. Maintain compatibility for external API consumers

## Conclusion

The neverthrow integration provides a more robust and type-safe approach to error handling in Axe Handle. By making errors part of your type signatures and forcing explicit handling of both success and error cases, your code becomes more predictable, easier to reason about, and less prone to uncaught exceptions.