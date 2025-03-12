import { createError, ErrorType, withErrorHandling, isAppError } from '../errors';

describe('Error utilities', () => {
  describe('createError', () => {
    it('should create an error with the specified type and message', () => {
      const error = createError(ErrorType.VALIDATION, 'Invalid input');
      
      expect(error).toEqual({
        type: ErrorType.VALIDATION,
        message: 'Invalid input',
      });
    });
    
    it('should include metadata if provided', () => {
      const metadata = { field: 'email', value: 'invalid' };
      const error = createError(ErrorType.VALIDATION, 'Invalid input', metadata);
      
      expect(error).toEqual({
        type: ErrorType.VALIDATION,
        message: 'Invalid input',
        metadata,
      });
    });
  });
  
  describe('withErrorHandling', () => {
    it('should return ok result when function succeeds', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await withErrorHandling(fn);
      
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('success');
    });
    
    it('should return err result when function throws', async () => {
      const error = new Error('Something went wrong');
      const fn = jest.fn().mockRejectedValue(error);
      
      const result = await withErrorHandling(fn);
      
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual({
        type: ErrorType.INTERNAL,
        message: 'Something went wrong',
      });
    });
    
    it('should use the provided error type', async () => {
      const error = new Error('Not found');
      const fn = jest.fn().mockRejectedValue(error);
      
      const result = await withErrorHandling(fn, ErrorType.NOT_FOUND);
      
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toEqual({
        type: ErrorType.NOT_FOUND,
        message: 'Not found',
      });
    });
  });
  
  describe('isAppError', () => {
    it('should return true for valid AppError objects', () => {
      const error = createError(ErrorType.VALIDATION, 'Invalid input');
      
      expect(isAppError(error)).toBe(true);
    });
    
    it('should return false for non-AppError objects', () => {
      expect(isAppError(new Error('Standard error'))).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({ message: 'Missing type' })).toBe(false);
      expect(isAppError({ type: 'UNKNOWN', message: 'Invalid type' })).toBe(false);
    });
  });
});