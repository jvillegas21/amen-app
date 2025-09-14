/**
 * Base repository interface providing common CRUD operations
 */
export interface IBaseRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  /**
   * Find entity by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find multiple entities by IDs
   */
  findByIds(ids: string[]): Promise<T[]>;

  /**
   * Find entities matching criteria
   */
  find(criteria?: Record<string, any>, options?: FindOptions): Promise<T[]>;

  /**
   * Find a single entity matching criteria
   */
  findOne(criteria: Record<string, any>): Promise<T | null>;

  /**
   * Create a new entity
   */
  create(data: TCreate): Promise<T>;

  /**
   * Create multiple entities
   */
  createMany(data: TCreate[]): Promise<T[]>;

  /**
   * Update an entity by ID
   */
  update(id: string, data: TUpdate): Promise<T>;

  /**
   * Update multiple entities matching criteria
   */
  updateMany(criteria: Record<string, any>, data: TUpdate): Promise<T[]>;

  /**
   * Delete an entity by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete multiple entities matching criteria
   */
  deleteMany(criteria: Record<string, any>): Promise<void>;

  /**
   * Check if entity exists by ID
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count entities matching criteria
   */
  count(criteria?: Record<string, any>): Promise<number>;
}

export interface FindOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  select?: string[];
  include?: string[];
}

export interface PaginationOptions extends FindOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Extended base repository with pagination support
 */
export interface IPaginatedRepository<T, TCreate = Partial<T>, TUpdate = Partial<T>>
  extends IBaseRepository<T, TCreate, TUpdate> {
  /**
   * Find entities with pagination
   */
  findPaginated(
    criteria?: Record<string, any>,
    options?: PaginationOptions
  ): Promise<PaginatedResult<T>>;
}