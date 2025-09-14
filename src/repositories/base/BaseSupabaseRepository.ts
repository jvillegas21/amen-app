import { SupabaseClient } from '@supabase/supabase-js';
import {
  IBaseRepository,
  IPaginatedRepository,
  FindOptions,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces/IBaseRepository';

/**
 * Base Supabase repository implementation providing common CRUD operations
 */
export abstract class BaseSupabaseRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>>
  implements IPaginatedRepository<T, TCreate, TUpdate>
{
  protected readonly supabase: SupabaseClient;
  protected readonly tableName: string;

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  /**
   * Get the table query builder
   */
  protected getQuery() {
    return this.supabase.from(this.tableName);
  }

  /**
   * Apply query options to a Supabase query
   */
  protected applyQueryOptions(query: any, options?: FindOptions) {
    if (!options) return query;

    // Apply select fields
    if (options.select && options.select.length > 0) {
      query = query.select(options.select.join(','));
    } else {
      query = query.select('*');
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, {
        ascending: options.orderDirection !== 'desc',
      });
    }

    // Apply pagination
    if (options.limit !== undefined) {
      if (options.offset !== undefined) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      } else {
        query = query.limit(options.limit);
      }
    }

    return query;
  }

  /**
   * Apply search criteria to query
   */
  protected applyCriteria(query: any, criteria?: Record<string, any>) {
    if (!criteria) return query;

    Object.entries(criteria).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object' && value.operator) {
          // Support for complex operators
          const { operator, value: opValue } = value;
          switch (operator) {
            case 'gt':
              query = query.gt(key, opValue);
              break;
            case 'gte':
              query = query.gte(key, opValue);
              break;
            case 'lt':
              query = query.lt(key, opValue);
              break;
            case 'lte':
              query = query.lte(key, opValue);
              break;
            case 'like':
              query = query.like(key, opValue);
              break;
            case 'ilike':
              query = query.ilike(key, opValue);
              break;
            case 'not':
              query = query.not(key, 'eq', opValue);
              break;
            default:
              query = query.eq(key, opValue);
          }
        } else {
          query = query.eq(key, value);
        }
      }
    });

    return query;
  }

  /**
   * Calculate pagination metadata
   */
  protected calculatePagination(
    total: number,
    page: number,
    pageSize: number
  ) {
    const totalPages = Math.ceil(total / pageSize);

    return {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.getQuery()
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find ${this.tableName} by ID: ${error.message}`);
    }

    return data;
  }

  async findByIds(ids: string[]): Promise<T[]> {
    const { data, error } = await this.getQuery()
      .select('*')
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to find ${this.tableName} by IDs: ${error.message}`);
    }

    return data || [];
  }

  async find(criteria?: Record<string, any>, options?: FindOptions): Promise<T[]> {
    let query = this.getQuery();
    query = this.applyCriteria(query, criteria);
    query = this.applyQueryOptions(query, options);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find ${this.tableName}: ${error.message}`);
    }

    return data || [];
  }

  async findOne(criteria: Record<string, any>): Promise<T | null> {
    const results = await this.find(criteria, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async create(data: TCreate): Promise<T> {
    const { data: result, error } = await this.getQuery()
      .insert(data as any)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create ${this.tableName}: ${error.message}`);
    }

    if (!result) {
      throw new Error(`Failed to create ${this.tableName}: No data returned`);
    }

    return result;
  }

  async createMany(data: TCreate[]): Promise<T[]> {
    const { data: results, error } = await this.getQuery()
      .insert(data as any[])
      .select('*');

    if (error) {
      throw new Error(`Failed to create ${this.tableName} records: ${error.message}`);
    }

    return results || [];
  }

  async update(id: string, data: TUpdate): Promise<T> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await this.getQuery()
      .update(updateData as any)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update ${this.tableName}: ${error.message}`);
    }

    if (!result) {
      throw new Error(`Failed to update ${this.tableName}: Record not found`);
    }

    return result;
  }

  async updateMany(criteria: Record<string, any>, data: TUpdate): Promise<T[]> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    let query = this.getQuery().update(updateData as any);
    query = this.applyCriteria(query, criteria);

    const { data: results, error } = await query.select('*');

    if (error) {
      throw new Error(`Failed to update ${this.tableName} records: ${error.message}`);
    }

    return results || [];
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getQuery()
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ${this.tableName}: ${error.message}`);
    }
  }

  async deleteMany(criteria: Record<string, any>): Promise<void> {
    let query = this.getQuery().delete();
    query = this.applyCriteria(query, criteria);

    const { error } = await query;

    if (error) {
      throw new Error(`Failed to delete ${this.tableName} records: ${error.message}`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.getQuery()
      .select('id')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw new Error(`Failed to check existence of ${this.tableName}: ${error.message}`);
    }

    return !!data;
  }

  async count(criteria?: Record<string, any>): Promise<number> {
    let query = this.getQuery().select('*', { count: 'exact', head: true });
    query = this.applyCriteria(query, criteria);

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count ${this.tableName}: ${error.message}`);
    }

    return count || 0;
  }

  async findPaginated(
    criteria?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>> {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || options?.limit || 20;
    const offset = (page - 1) * pageSize;

    // Get total count
    const total = await this.count(criteria);

    // Get paginated data
    const data = await this.find(criteria, {
      ...options,
      offset,
      limit: pageSize,
    });

    const pagination = this.calculatePagination(total, page, pageSize);

    return { data, pagination };
  }
}