// lib/security.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = {
  // Simple in-memory rate limiter
  check(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = identifier;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  },

  // Get remaining requests
  remaining(identifier: string, limit: number = 10, windowMs: number = 60000): number {
    const now = Date.now();
    const key = identifier;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      return limit;
    }

    return Math.max(0, limit - record.count);
  }
};

export const security = {
  // Validate file upload
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.webp']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX, WEBP' };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'Invalid file extension' };
    }

    return { valid: true };
  },

  // Sanitize input
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  },

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate matric number format (EKSU format)
  validateMatricNumber(matric: string): boolean {
    const matricRegex = /^[A-Z]{2,3}\/\d{2}\/\d{4}$/i;
    return matricRegex.test(matric);
  },

  // Generate secure filename
  generateSecureFilename(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${userId}_${timestamp}_${sanitizedName}`;
  },

  // Check for malicious content in file
  async checkFileContent(file: File): Promise<{ safe: boolean; reason?: string }> {
    try {
      const buffer = await file.arrayBuffer();
      const content = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 1024)); // Check first 1KB

      // Check for common malicious patterns
      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.cookie/i,
        /window\.location/i
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(content)) {
          return { safe: false, reason: 'File contains potentially malicious content' };
        }
      }

      return { safe: true };
    } catch (error) {
      return { safe: false, reason: 'Unable to scan file content' };
    }
  }
};

// Middleware for rate limiting
export function withRateLimit(limit: number = 10, windowMs: number = 60000) {
  return function(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async function(req: NextRequest): Promise<NextResponse> {
      // Use the x-forwarded-for header, or fall back to other available info
      const ip =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';
      
      if (!rateLimiter.check(ip, limit, windowMs)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }

      return handler(req);
    };
  };
}

// CSRF protection
export const csrfProtection = {
  generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },

  validateToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }
};

// Input sanitization middleware
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return security.sanitizeInput(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Apply security headers to response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}