/**
 * Dependency Injection Container
 * Provides service registration and resolution for better testability and maintainability
 */

type ServiceConstructor<T> = new (...args: any[]) => T;
type ServiceFactory<T> = (...args: any[]) => T;

interface ServiceDefinition<T> {
  factory: ServiceFactory<T> | ServiceConstructor<T>;
  dependencies?: string[];
  singleton?: boolean;
  instance?: T;
}

export class DIContainer {
  private services: Map<string, ServiceDefinition<any>> = new Map();
  private instances: Map<string, any> = new Map();

  /**
   * Register a service with the container
   */
  register<T>(
    name: string,
    factory: ServiceFactory<T> | ServiceConstructor<T>,
    options: {
      dependencies?: string[];
      singleton?: boolean;
    } = {}
  ): void {
    this.services.set(name, {
      factory,
      dependencies: options.dependencies || [],
      singleton: options.singleton !== false, // Default to singleton
    });
  }

  /**
   * Register a singleton instance directly
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, {
      factory: () => instance,
      singleton: true,
      instance,
    });
    this.instances.set(name, instance);
  }

  /**
   * Register a factory function
   */
  registerFactory<T>(
    name: string,
    factory: ServiceFactory<T>,
    dependencies: string[] = []
  ): void {
    this.register(name, factory, {
      dependencies,
      singleton: true,
    });
  }

  /**
   * Register a class constructor
   */
  registerClass<T>(
    name: string,
    constructor: ServiceConstructor<T>,
    dependencies: string[] = []
  ): void {
    this.register(name, constructor, {
      dependencies,
      singleton: true,
    });
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    const serviceDefinition = this.services.get(name);
    if (!serviceDefinition) {
      throw new Error(`Service '${name}' is not registered`);
    }

    // Return existing singleton instance if available
    if (serviceDefinition.singleton && serviceDefinition.instance) {
      return serviceDefinition.instance;
    }

    // Check instances cache
    if (serviceDefinition.singleton && this.instances.has(name)) {
      return this.instances.get(name);
    }

    // Resolve dependencies first
    const dependencies = serviceDefinition.dependencies || [];
    const resolvedDependencies = dependencies.map(dep => this.resolve(dep));

    // Create instance
    let instance: T;
    const factory = serviceDefinition.factory;

    if (this.isConstructor(factory)) {
      instance = new (factory as ServiceConstructor<T>)(...resolvedDependencies);
    } else {
      instance = (factory as ServiceFactory<T>)(...resolvedDependencies);
    }

    // Cache singleton instances
    if (serviceDefinition.singleton) {
      serviceDefinition.instance = instance;
      this.instances.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   */
  unregister(name: string): void {
    this.services.delete(name);
    this.instances.delete(name);
  }

  /**
   * Clear all services and instances
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }

  /**
   * Get all registered service names
   */
  getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a scoped container (child container)
   */
  createScope(): DIContainer {
    const scopedContainer = new DIContainer();

    // Copy parent services
    this.services.forEach((definition, name) => {
      scopedContainer.services.set(name, { ...definition });
    });

    return scopedContainer;
  }

  /**
   * Auto-wire dependencies using decorators or metadata (simplified)
   */
  autoWire<T>(constructor: ServiceConstructor<T>): T {
    // This would typically use reflection or metadata
    // For React Native, we'll keep it simple
    return new constructor();
  }

  /**
   * Check if a function is a constructor
   */
  private isConstructor(func: any): boolean {
    try {
      // Check if function has prototype property
      return func.prototype && func.prototype.constructor === func;
    } catch {
      return false;
    }
  }
}

// Global container instance
let globalContainer: DIContainer | null = null;

/**
 * Get the global DI container
 */
export function getContainer(): DIContainer {
  if (!globalContainer) {
    globalContainer = new DIContainer();
  }
  return globalContainer;
}

/**
 * Set a custom global container
 */
export function setContainer(container: DIContainer): void {
  globalContainer = container;
}

/**
 * Clear the global container
 */
export function clearContainer(): void {
  globalContainer = null;
}

export default DIContainer;