// lib/validators.ts
import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  // ObjectId validation
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  // Email validation
  email: z.string().email('Invalid email format'),
  
  // Matric number validation (EKSU format)
  matricNumber: z.string().regex(/^[A-Z]{2,3}\/\d{2}\/\d{4}$/i, 'Invalid matric number format (e.g., CS/20/1234)'),
  
  // Phone number validation
  phoneNumber: z.string().regex(/^(\+234|234|0)?[789][01]\d{8}$/, 'Invalid Nigerian phone number format'),
  
  // Password validation
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Name validation
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  // File validation
  file: z.object({
    name: z.string().min(1, 'File name is required'),
    size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    type: z.string().regex(/^(application\/pdf|image\/(jpeg|jpg|png|webp)|application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document))$/, 'Invalid file type')
  })
};

// Authentication schemas
export const authSchemas = {
  studentSignup: z.object({
    matric_no: commonSchemas.matricNumber,
    first_name: commonSchemas.name.optional().default(''),
    last_name: commonSchemas.name,
    email: commonSchemas.email.optional().or(z.literal('')).default(''),
    department: z.string().min(1, 'Department is required').max(100),
    password: commonSchemas.password
  }),

  studentSignin: z.object({
    matric_no: commonSchemas.matricNumber,
    password: z.string().min(1, 'Password is required')
  }),

  officerSignin: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),

  adminSignin: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required')
  })
};

// Student schemas
export const studentSchemas = {
  uploadDocument: z.object({
    step_id: commonSchemas.objectId,
    file: commonSchemas.file
  }),

  updateProfile: z.object({
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    phoneNumber: commonSchemas.phoneNumber.optional(),
    address: z.string().max(500, 'Address must be less than 500 characters').optional()
  })
};

// Officer schemas
export const officerSchemas = {
  approveReject: z.object({
    studentId: commonSchemas.objectId,
    stepId: commonSchemas.objectId,
    action: z.enum(['approve', 'reject']),
    comment: z.string().max(500, 'Comment must be less than 500 characters').optional().default('')
  }),

  addOfficer: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    position: z.string().min(1, 'Position is required').max(100),
    department: z.string().min(1, 'Department is required').max(100),
    assignedStepId: commonSchemas.objectId.optional(),
    password: commonSchemas.password.optional()
  }),

  updateOfficer: z.object({
    name: commonSchemas.name.optional(),
    email: commonSchemas.email.optional(),
    position: z.string().min(1).max(100).optional(),
    department: z.string().min(1).max(100).optional(),
    assignedStepId: commonSchemas.objectId.optional()
  })
};

// Admin schemas
export const adminSchemas = {
  createStep: z.object({
    stepNumber: z.number().int().min(1, 'Step number must be at least 1'),
    name: z.string().min(1, 'Step name is required').max(200),
    requiresPayment: z.boolean().optional().default(false),
    paymentAmount: z.number().min(0).optional()
  }),

  updateStep: z.object({
    stepNumber: z.number().int().min(1).optional(),
    name: z.string().min(1).max(200).optional(),
    requiresPayment: z.boolean().optional(),
    paymentAmount: z.number().min(0).optional()
  }),

  createDepartment: z.object({
    name: z.string().min(1, 'Department name is required').max(100),
    description: z.string().max(500).optional(),
    headOfficerId: commonSchemas.objectId.optional()
  }),

  updateDepartment: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    headOfficerId: commonSchemas.objectId.optional()
  })
};

// Notification schemas
export const notificationSchemas = {
  markRead: z.object({
    notificationId: commonSchemas.objectId.optional(),
    markAll: z.boolean().optional().default(false)
  }).refine(data => data.notificationId || data.markAll, {
    message: "Either notificationId or markAll must be provided"
  }),

  createNotification: z.object({
    userId: z.string().min(1, 'User ID is required'),
    title: z.string().min(1, 'Title is required').max(200),
    message: z.string().min(1, 'Message is required').max(1000),
    type: z.enum(['info', 'success', 'warning', 'error']).default('info')
  })
};

// Clearance schemas
export const clearanceSchemas = {
  updateProgress: z.object({
    studentId: commonSchemas.objectId,
    stepId: commonSchemas.objectId,
    status: z.enum(['pending', 'approved', 'rejected']),
    comment: z.string().max(500).optional(),
    officerId: commonSchemas.objectId.optional()
  }),

  overrideClearance: z.object({
    studentId: commonSchemas.objectId,
    stepId: commonSchemas.objectId,
    action: z.enum(['approve', 'reject', 'reset']),
    reason: z.string().min(1, 'Reason is required').max(500)
  })
};

// API request schemas
export const apiSchemas = {
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  }),

  search: z.object({
    query: z.string().min(1, 'Search query is required').max(100),
    filters: z.record(z.string(), z.any()).optional()
  })
};

// File upload schemas
export const fileSchemas = {
  upload: z.object({
    stepId: commonSchemas.objectId,
    file: z.object({
      name: z.string().min(1),
      size: z.number().max(10 * 1024 * 1024),
      type: z.string(),
      lastModified: z.number()
    })
  }),

  download: z.object({
    fileId: commonSchemas.objectId,
    token: z.string().min(1, 'Download token is required')
  })
};

// Validation helper functions
export const validators = {
  // Validate request body
  validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = (error as z.ZodError<any>).issues
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new Error(`Validation error: ${errorMessage}`);
      }
      throw error;
    }
  },

  // Validate query parameters
  validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
    const data = Object.fromEntries(searchParams.entries());
    return this.validateBody(schema, data);
  },

  // Validate file upload
  validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
  } = {}): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024,
      allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    } = options;

    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type' };
    }

    return { valid: true };
  },

  // Sanitize string input
  sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  },

  // Validate and sanitize object
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = {} as T;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key as keyof T] = this.sanitizeString(value) as T[keyof T];
      } else if (Array.isArray(value)) {
        sanitized[key as keyof T] = value.map(item => 
          typeof item === 'string' ? this.sanitizeString(item) : item
        ) as T[keyof T];
      } else if (value && typeof value === 'object') {
        sanitized[key as keyof T] = this.sanitizeObject(value) as T[keyof T];
      } else {
        sanitized[key as keyof T] = value;
      }
    }
    
    return sanitized;
  }
};

// Export all schemas for easy access
export const schemas = {
  common: commonSchemas,
  auth: authSchemas,
  student: studentSchemas,
  officer: officerSchemas,
  admin: adminSchemas,
  notification: notificationSchemas,
  clearance: clearanceSchemas,
  api: apiSchemas,
  file: fileSchemas
};