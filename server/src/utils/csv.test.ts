import { describe, it, expect } from 'vitest';
import { sanitizeCsvValue, generateCsv, parseCsv } from './csv.js';

describe('CSV Utility', () => {
  describe('sanitizeCsvValue', () => {
    it('should prepend a single quote to values starting with =, +, -, @, or \\r', () => {
      expect(sanitizeCsvValue('=1+2')).toBe("'=1+2");
      expect(sanitizeCsvValue('+sum(A1:A2)')).toBe("'+sum(A1:A2)");
      expect(sanitizeCsvValue('-100')).toBe("'-100");
      expect(sanitizeCsvValue('@someone')).toBe("'@someone");
      expect(sanitizeCsvValue('\rSomething')).toBe("'\rSomething");
    });

    it('should not modify safe values', () => {
      expect(sanitizeCsvValue('Safe Value')).toBe('Safe Value');
      expect(sanitizeCsvValue('123')).toBe('123');
      expect(sanitizeCsvValue('')).toBe('');
      expect(sanitizeCsvValue('a=b')).toBe('a=b');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeCsvValue(null)).toBe('');
      expect(sanitizeCsvValue(undefined)).toBe('');
    });
  });

  describe('generateCsv', () => {
    it('should generate a sanitized CSV string', () => {
      const data = [
        { name: 'John', score: '=100+50' },
        { name: 'Jane', score: '100' },
      ];
      const csv = generateCsv(data);
      expect(csv).toContain('name,score');
      expect(csv).toContain("John,'=100+50");
      expect(csv).toContain('Jane,100');
    });
  });

  describe('parseCsv', () => {
    it('should parse a CSV buffer into an array of objects', () => {
      const csvContent = 'name,email\nJohn Doe,john@example.com\nJane Doe,jane@example.com';
      const buffer = Buffer.from(csvContent);
      const data = parseCsv(buffer);
      expect(data).toHaveLength(2);
      expect(data[0]).toEqual({ name: 'John Doe', email: 'john@example.com' });
      expect(data[1]).toEqual({ name: 'Jane Doe', email: 'jane@example.com' });
    });

    it('should trim headers and values', () => {
      const csvContent = ' name , email \n John Doe , john@example.com ';
      const buffer = Buffer.from(csvContent);
      const data = parseCsv(buffer);
      expect(data[0]).toEqual({ name: 'John Doe', email: 'john@example.com' });
    });
  });
});
