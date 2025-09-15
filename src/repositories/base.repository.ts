import { supabase } from '@/config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Base Repository Interface
 * Provides common database operations and error handling
 */
export interface BaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filters?: Record<string, any>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

/**
 * Base Repository Implementation
 * Handles common database operations with proper error handling
 */
export abstract class BaseRepositoryImpl<T> implements BaseRepository<T> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Handle database errors with proper transformation
   */
  protected handleError(error: PostgrestError, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    
    // Transform common database errors to user-friendly messages
    switch (error.code) {
      case '23505': // Unique constraint violation
        throw new Error('This record already exists');
      case '23503': // Foreign key constraint violation
        throw new Error('Referenced record does not exist');
      case '23502': // Not null constraint violation
        throw new Error('Required field is missing');
      case 'PGRST116': // Row not found
        throw new Error('Record not found');
      default:
        throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  /**
   * Execute a query with error handling
   */
  protected async executeQuery<R>(
    queryFn: () => Promise<{ data: R | null; error: PostgrestError | null }>,
    operation: string
  ): Promise<R> {
    const { data, error } = await queryFn();
    
    if (error) {
      this.handleError(error, operation);
    }
    
    if (data === null) {
      throw new Error('No data returned from database');
    }
    
    return data;
  }

  /**
   * Execute a query that might return null
   */
  protected async executeQueryNullable<R>(
    queryFn: () => Promise<{ data: R | null; error: PostgrestError | null }>,
    operation: string
  ): Promise<R | null> {
    const { data, error } = await queryFn();
    
    if (error) {
      this.handleError(error, operation);
    }
    
    return data;
  }

  /**
   * Find record by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.executeQueryNullable(
      () => supabase.from(this.tableName).select('*').eq('id', id).maybeSingle(),
      `findById(${id})`
    );
  }

  /**
   * Find all records with optional filters
   */
  async findAll(filters: Record<string, any> = {}): Promise<T[]> {
    let query = supabase.from(this.tableName).select('*');
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      this.handleError(error, 'findAll');
    }
    
    return data || [];
  }

  /**
   * Create new record
   */
  async create(data: Partial<T>): Promise<T> {
    return this.executeQuery(
      () => supabase.from(this.tableName).insert(data).select().single(),
      'create'
    );
  }

  /**
   * Update record by ID
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    return this.executeQuery(
      () => supabase.from(this.tableName).update(data).eq('id', id).select().single(),
      `update(${id})`
    );
  }

  /**
   * Delete record by ID
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      this.handleError(error, `delete(${id})`);
    }
  }
}

/**
 * Repository Factory
 * Creates repository instances with proper dependency injection
 */
export class RepositoryFactory {
  private static repositories = new Map<string, any>();

  static getRepository<T>(repositoryClass: new (...args: any[]) => T): T {
    const key = repositoryClass.name;
    
    if (!this.repositories.has(key)) {
      this.repositories.set(key, new repositoryClass());
    }
    
    return this.repositories.get(key);
  }

  static clearCache(): void {
    this.repositories.clear();
  }
}