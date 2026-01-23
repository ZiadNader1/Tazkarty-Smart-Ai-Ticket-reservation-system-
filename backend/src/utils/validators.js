// src/utils/validators.js

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate Email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Phone Number (Egyptian format)
 */
export const isValidPhone = (phone) => {
  // Egyptian phone: 01xxxxxxxxx (11 digits)
  const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate Password Strength
 * - At least 8 characters
 * - At least 1 uppercase
 * - At least 1 lowercase
 * - At least 1 number
 */
export const isStrongPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate Date Range
 */
export const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

/**
 * Sanitize Input (remove HTML tags)
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '').trim();
};

/**
 * Validate Event Type
 */
export const isValidEventType = (type) => {
  const validTypes = ['movie', 'concert', 'sports', 'show'];
  return validTypes.includes(type);
};

/**
 * Validate Seat Status
 */
export const isValidSeatStatus = (status) => {
  const validStatuses = ['available', 'locked', 'booked'];
  return validStatuses.includes(status);
};

/**
 * Validation Middleware Creator
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];

    // Validate each field in schema
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      // Required check
      if (rules.required && !value) {
        validationErrors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is optional and not provided
      if (!rules.required && !value) continue;

      // Type check
      if (rules.type && typeof value !== rules.type) {
        validationErrors.push(`${field} must be a ${rules.type}`);
      }

      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        validationErrors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        validationErrors.push(`${field} must be at most ${rules.maxLength} characters`);
      }

      // Custom validator
      if (rules.validator && !rules.validator(value)) {
        validationErrors.push(rules.message || `${field} is invalid`);
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    next();
  };
};

// ===== Example Usage =====

// Event validation schema
export const eventValidationSchema = {
  title: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200
  },
  category_id: {
    required: true,
    type: 'string',
    validator: isValidObjectId,
    message: 'Invalid category ID'
  },
  venue_id: {
    required: true,
    type: 'string',
    validator: isValidObjectId,
    message: 'Invalid venue ID'
  },
  type: {
    required: true,
    type: 'string',
    validator: isValidEventType,
    message: 'Invalid event type'
  }
};

// User registration validation schema
export const userRegistrationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100
  },
  email: {
    required: true,
    type: 'string',
    validator: isValidEmail,
    message: 'Invalid email format'
  },
  password: {
    required: true,
    type: 'string',
    validator: isStrongPassword,
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  phone: {
    required: false,
    type: 'string',
    validator: isValidPhone,
    message: 'Invalid Egyptian phone number format (01xxxxxxxxx)'
  }
};