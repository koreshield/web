/**
 * KoreShield Client Tests
 */

import { KoreShieldClient } from '../core/client';
import { validateConfig, sanitizeInput, checkResponseSafety } from '../utils';

describe('KoreShieldClient', () => {
  const config = {
    baseURL: 'http://localhost:8000',
    apiKey: 'test-key',
    timeout: 5000
  };

  let client: KoreShieldClient;

  beforeEach(() => {
    client = new KoreShieldClient(config);
  });

  describe('initialization', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(KoreShieldClient);
    });

    it('should throw on invalid config', () => {
      expect(() => {
        new KoreShieldClient({ baseURL: '' });
      }).toThrow();
    });
  });

  describe('testConnection', () => {
    it('should return false for unreachable server', async () => {
      const badClient = new KoreShieldClient({
        baseURL: 'http://invalid-url-that-does-not-exist-12345.com',
        timeout: 1000
      });
      const result = await badClient.testConnection();
      expect(result).toBe(false);
    });
  });
});

describe('Utility Functions', () => {
  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config = {
        baseURL: 'https://example.com',
        apiKey: 'test-key'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid config', () => {
      const config = {
        baseURL: 'not-a-url',
        apiKey: ''
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello World');
    });

    it('should remove javascript URLs', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });
  });

  describe('checkResponseSafety', () => {
    it('should detect safe responses', () => {
      const response = 'This is a normal response about AI safety.';
      const result = checkResponseSafety(response);
      expect(result.safe).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect script tags', () => {
      const response = 'Here is some code: <script>alert(1)</script>';
      const result = checkResponseSafety(response);
      expect(result.safe).toBe(false);
      expect(result.issues).toContain('Contains script tags');
      expect(result.severity).toBe('high');
    });

    it('should detect harmful instructions', () => {
      const response = 'Step 1: Download malware.exe\nStep 2: Run it';
      const result = checkResponseSafety(response);
      expect(result.safe).toBe(false);
      expect(result.issues).toContain('Contains potentially harmful instructions');
    });
  });
});