import { generateFileHeader, normalizeFilePath, validateFileHeader } from '../fileHeaders';
import { ErrorType } from '../errors';

describe('File Header Utilities', () => {
  describe('normalizeFilePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(normalizeFilePath('src\\utils\\fileHeaders.ts')).toBe('src/utils/fileHeaders.ts');
    });
    
    it('should remove leading ./ or / characters', () => {
      expect(normalizeFilePath('./src/utils/fileHeaders.ts')).toBe('src/utils/fileHeaders.ts');
      expect(normalizeFilePath('/src/utils/fileHeaders.ts')).toBe('src/utils/fileHeaders.ts');
    });
    
    it('should handle combined cases', () => {
      expect(normalizeFilePath('./src\\utils/fileHeaders.ts')).toBe('src/utils/fileHeaders.ts');
    });
  });
  
  describe('generateFileHeader', () => {
    // Mock the current date for consistent testing
    const realDate = global.Date;
    const mockDate = new Date('2025-01-01T00:00:00.000Z');
    
    beforeAll(() => {
      global.Date = class extends Date {
        constructor() {
          super();
          return mockDate;
        }
        
        static now() {
          return mockDate.getTime();
        }
      } as unknown as DateConstructor;
    });
    
    afterAll(() => {
      global.Date = realDate;
    });
    
    it('should generate a header with default values', () => {
      const header = generateFileHeader('src/utils/fileHeaders.ts');
      
      expect(header).toContain('@file src/utils/fileHeaders.ts');
      expect(header).toContain('@author Axe Handle Team');
      expect(header).toContain('@copyright Copyright (c) 2025 Axe Handle Project');
      expect(header).toContain('@license ISC');
      expect(header).toContain('@created 2025-01-01T00:00:00.000Z');
    });
    
    it('should allow custom values', () => {
      const header = generateFileHeader('src/utils/fileHeaders.ts', {
        author: 'Test Author',
        description: 'File header utilities',
        copyright: 'Custom Copyright',
        license: 'MIT'
      });
      
      expect(header).toContain('@file src/utils/fileHeaders.ts');
      expect(header).toContain('@author Test Author');
      expect(header).toContain('@description File header utilities');
      expect(header).toContain('@copyright Custom Copyright');
      expect(header).toContain('@license MIT');
    });
    
    it('should normalize the file path', () => {
      const header = generateFileHeader('./src\\utils/fileHeaders.ts');
      
      expect(header).toContain('@file src/utils/fileHeaders.ts');
    });
  });
  
  describe('validateFileHeader', () => {
    it('should return ok when file has correct header', () => {
      const content = `/**
 * @file src/utils/test.ts
 * @description Test file
 * @author Test Author
 * @created 2025-01-01T00:00:00.000Z
 * @copyright Copyright (c) 2025
 * @license MIT
 */
 
const test = () => {
  console.log('test');
};`;
      
      const result = validateFileHeader(content, 'src/utils/test.ts');
      
      expect(result.isOk()).toBe(true);
    });
    
    it('should return error when file has incorrect header path', () => {
      const content = `/**
 * @file src/wrong/path.ts
 * @description Test file
 */
 
const test = () => {
  console.log('test');
};`;
      
      const result = validateFileHeader(content, 'src/utils/test.ts');
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe(ErrorType.VALIDATION);
        expect(result.error.message).toContain('Missing or incorrect @file path');
      }
    });
    
    it('should return error when file has no header', () => {
      const content = `const test = () => {
  console.log('test');
};`;
      
      const result = validateFileHeader(content, 'src/utils/test.ts');
      
      expect(result.isErr()).toBe(true);
    });
    
    it('should handle path with special regex characters', () => {
      const content = `/**
 * @file src/utils/special+chars.ts
 */`;
      
      const result = validateFileHeader(content, 'src/utils/special+chars.ts');
      
      expect(result.isOk()).toBe(true);
    });
  });
});