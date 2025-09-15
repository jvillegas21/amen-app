import { PostgrestError } from '@supabase/supabase-js';

/**
 * Error Transformation Service
 * Transforms database and API errors into user-friendly messages
 */
export class ErrorTransformationService {
  /**
   * Transform Supabase/Postgrest errors to user-friendly messages
   */
  static transformDatabaseError(error: PostgrestError, context?: string): string {
    console.error(`Database error${context ? ` in ${context}` : ''}:`, error);

    // Common database error codes and their user-friendly messages
    switch (error.code) {
      case '23505': // Unique constraint violation
        return 'This record already exists. Please try again.';
      
      case '23503': // Foreign key constraint violation
        return 'Referenced record does not exist.';
      
      case '23502': // Not null constraint violation
        return 'Required information is missing. Please fill in all required fields.';
      
      case '23514': // Check constraint violation
        return 'The data provided does not meet the requirements.';
      
      case 'PGRST116': // Row not found
        return 'The requested item could not be found.';
      
      case 'PGRST301': // Multiple rows returned when single expected
        return 'Multiple items found when only one was expected.';
      
      case 'PGRST302': // No rows returned when at least one expected
        return 'No items found matching your request.';
      
      case '42501': // Insufficient privilege
        return 'You do not have permission to perform this action.';
      
      case '42P01': // Undefined table
        return 'Database configuration error. Please contact support.';
      
      case '42703': // Undefined column
        return 'Database configuration error. Please contact support.';
      
      default:
        // For unknown errors, provide a generic message
        return 'An unexpected error occurred. Please try again later.';
    }
  }

  /**
   * Transform network errors
   */
  static transformNetworkError(error: any, context?: string): string {
    console.error(`Network error${context ? ` in ${context}` : ''}:`, error);

    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Please log in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.status === 404) {
      return 'The requested resource was not found.';
    }

    if (error.status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Transform authentication errors
   */
  static transformAuthError(error: any, context?: string): string {
    console.error(`Auth error${context ? ` in ${context}` : ''}:`, error);

    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before logging in.';
      
      case 'User not found':
        return 'No account found with this email address.';
      
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      
      case 'Signup requires a valid password':
        return 'Please enter a valid password.';
      
      case 'User already registered':
        return 'An account with this email already exists. Please log in instead.';
      
      case 'Invalid email':
        return 'Please enter a valid email address.';
      
      case 'Token has expired':
        return 'Your session has expired. Please log in again.';
      
      default:
        return 'Authentication error. Please try again.';
    }
  }

  /**
   * Transform validation errors
   */
  static transformValidationError(error: any, context?: string): string {
    console.error(`Validation error${context ? ` in ${context}` : ''}:`, error);

    if (error.message) {
      return error.message;
    }

    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map((e: any) => e.message).join(', ');
    }

    return 'Please check your input and try again.';
  }

  /**
   * Generic error transformer - tries to determine error type and transform accordingly
   */
  static transformError(error: any, context?: string): string {
    // Check if it's a PostgrestError
    if (error.code && error.message && error.details) {
      return this.transformDatabaseError(error, context);
    }

    // Check if it's a network/HTTP error
    if (error.status || error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      return this.transformNetworkError(error, context);
    }

    // Check if it's an auth error
    if (error.message && (
      error.message.includes('login') ||
      error.message.includes('password') ||
      error.message.includes('email') ||
      error.message.includes('token') ||
      error.message.includes('session')
    )) {
      return this.transformAuthError(error, context);
    }

    // Check if it's a validation error
    if (error.errors || error.message?.includes('validation') || error.message?.includes('required')) {
      return this.transformValidationError(error, context);
    }

    // Default fallback
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Create a standardized error object
   */
  static createErrorObject(
    originalError: any,
    context?: string,
    userMessage?: string
  ): {
    originalError: any;
    userMessage: string;
    context?: string;
    timestamp: string;
    errorType: string;
  } {
    const transformedMessage = userMessage || this.transformError(originalError, context);
    
    return {
      originalError,
      userMessage: transformedMessage,
      context,
      timestamp: new Date().toISOString(),
      errorType: this.getErrorType(originalError),
    };
  }

  /**
   * Determine the type of error
   */
  private static getErrorType(error: any): string {
    if (error.code && error.message && error.details) {
      return 'database';
    }
    
    if (error.status || error.code === 'NETWORK_ERROR') {
      return 'network';
    }
    
    if (error.message && (
      error.message.includes('login') ||
      error.message.includes('password') ||
      error.message.includes('email') ||
      error.message.includes('token')
    )) {
      return 'authentication';
    }
    
    if (error.errors || error.message?.includes('validation')) {
      return 'validation';
    }
    
    return 'unknown';
  }
}

/**
 * Error boundary helper for React components
 */
export class ErrorBoundaryHelper {
  /**
   * Handle errors in React components
   */
  static handleComponentError(error: any, errorInfo: any): {
    userMessage: string;
    shouldReport: boolean;
    errorId: string;
  } {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.error(`Component error [${errorId}]:`, error, errorInfo);
    
    const userMessage = ErrorTransformationService.transformError(error, 'component');
    
    // Determine if error should be reported to monitoring service
    const shouldReport = this.shouldReportError(error);
    
    return {
      userMessage,
      shouldReport,
      errorId,
    };
  }

  /**
   * Determine if an error should be reported to monitoring
   */
  private static shouldReportError(error: any): boolean {
    // Don't report validation errors or user input errors
    if (error.message?.includes('validation') || 
        error.message?.includes('required') ||
        error.message?.includes('Invalid')) {
      return false;
    }
    
    // Don't report authentication errors (they're expected)
    if (error.message?.includes('login') ||
        error.message?.includes('password') ||
        error.message?.includes('token')) {
      return false;
    }
    
    // Report all other errors
    return true;
  }
}