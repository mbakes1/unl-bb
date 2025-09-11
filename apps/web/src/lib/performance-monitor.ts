// Performance monitoring utilities for tracking optimization gains
import React from "react";

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = process.env.NODE_ENV === "development";

  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  end(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log performance metrics in development
    console.log(
      `🚀 Performance: ${name} took ${duration.toFixed(2)}ms`,
      metric.metadata
    );

    return duration;
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(
      (m) => m.duration !== undefined
    );
  }

  clear(): void {
    this.metrics.clear();
  }

  // Database query performance tracking
  trackDatabaseQuery(queryName: string, metadata?: Record<string, any>) {
    return {
      start: () => this.start(`db:${queryName}`, metadata),
      end: () => this.end(`db:${queryName}`),
    };
  }

  // API request performance tracking
  trackApiRequest(endpoint: string, method: string = "GET") {
    return {
      start: () => this.start(`api:${method}:${endpoint}`),
      end: () => this.end(`api:${method}:${endpoint}`),
    };
  }

  // Component render performance tracking
  trackComponentRender(componentName: string, props?: Record<string, any>) {
    return {
      start: () => this.start(`render:${componentName}`, props),
      end: () => this.end(`render:${componentName}`),
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// React hook for component performance tracking
export function usePerformanceTracking(
  componentName: string,
  dependencies: any[] = []
) {
  if (process.env.NODE_ENV === "development") {
    const tracker = performanceMonitor.trackComponentRender(componentName);
    tracker.start();

    // Track re-renders
    React.useEffect(() => {
      tracker.end();
      tracker.start();

      return () => {
        tracker.end();
      };
    }, dependencies);
  }
}

// Utility for measuring cache hit rates
export class CacheMetrics {
  private hits: number = 0;
  private misses: number = 0;
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  hit(): void {
    this.hits++;
    this.logStats();
  }

  miss(): void {
    this.misses++;
    this.logStats();
  }

  private logStats(): void {
    const total = this.hits + this.misses;
    if (total > 0 && total % 10 === 0) {
      // Log every 10 requests
      const hitRate = ((this.hits / total) * 100).toFixed(1);
      console.log(
        `📊 Cache ${this.name}: ${hitRate}% hit rate (${this.hits}/${total})`
      );
    }
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }
}

export const dbCacheMetrics = new CacheMetrics("Database");
export const apiCacheMetrics = new CacheMetrics("API");
