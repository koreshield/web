/**
 * Angular Services for KoreShield
 */

import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { KoreShieldClient } from '../core/client';
import {
  KoreShieldConfig,
  ChatCompletionRequest,
  ChatCompletionResponse,
  SecurityOptions,
  SecurityEvent,
  MetricsResponse
} from '../types';

@Injectable({
  providedIn: 'root'
})
export class KoreShieldService implements OnDestroy {
  private client: KoreShieldClient | null = null;
  private destroy$ = new Subject<void>();

  private isConnectedSubject = new BehaviorSubject<boolean>(false);
  public isConnected$ = this.isConnectedSubject.asObservable();

  private errorSubject = new BehaviorSubject<Error | null>(null);
  public error$ = this.errorSubject.asObservable();

  async initialize(config: KoreShieldConfig): Promise<void> {
    try {
      this.client = new KoreShieldClient(config);
      const health = await this.client.health();
      
      if (health.status === 'ok') {
        this.isConnectedSubject.next(true);
        this.errorSubject.next(null);
      }
    } catch (error) {
      this.errorSubject.next(error as Error);
      this.isConnectedSubject.next(false);
      throw error;
    }
  }

  disconnect(): void {
    this.client = null;
    this.isConnectedSubject.next(false);
  }

  async createChatCompletion(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): Promise<ChatCompletionResponse> {
    if (!this.client) {
      throw new Error('KoreShield client not initialized');
    }
    return this.client.createChatCompletion(request, securityOptions);
  }

  async getSecurityEvents(
    limit: number = 50,
    offset: number = 0
  ): Promise<SecurityEvent[]> {
    if (!this.client) {
      throw new Error('KoreShield client not initialized');
    }
    return this.client.getSecurityEvents(limit, offset);
  }

  async getMetrics(): Promise<MetricsResponse> {
    if (!this.client) {
      throw new Error('KoreShield client not initialized');
    }
    return this.client.getMetrics();
  }

  async health(): Promise<{ status: string; version: string; uptime: number }> {
    if (!this.client) {
      throw new Error('KoreShield client not initialized');
    }
    return this.client.health();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}

@Injectable()
export class ChatCompletionService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private responseSubject = new BehaviorSubject<ChatCompletionResponse | null>(null);
  public response$ = this.responseSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<Error | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private koreShieldService: KoreShieldService) {}

  async execute(
    request: ChatCompletionRequest,
    securityOptions?: SecurityOptions
  ): Promise<void> {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const response = await this.koreShieldService.createChatCompletion(
        request,
        securityOptions
      );
      this.responseSubject.next(response);
    } catch (error) {
      this.errorSubject.next(error as Error);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  reset(): void {
    this.responseSubject.next(null);
    this.errorSubject.next(null);
    this.isLoadingSubject.next(false);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Injectable()
export class SecurityEventsService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private eventsSubject = new BehaviorSubject<SecurityEvent[]>([]);
  public events$ = this.eventsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<Error | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private koreShieldService: KoreShieldService) {}

  async refresh(limit: number = 50): Promise<void> {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const events = await this.koreShieldService.getSecurityEvents(limit);
      this.eventsSubject.next(events);
    } catch (error) {
      this.errorSubject.next(error as Error);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  startAutoRefresh(intervalMs: number = 5000): void {
    interval(intervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Injectable()
export class MetricsService implements OnDestroy {
  private destroy$ = new Subject<void>();

  private metricsSubject = new BehaviorSubject<MetricsResponse | null>(null);
  public metrics$ = this.metricsSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<Error | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private koreShieldService: KoreShieldService) {}

  async refresh(): Promise<void> {
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    try {
      const metrics = await this.koreShieldService.getMetrics();
      this.metricsSubject.next(metrics);
    } catch (error) {
      this.errorSubject.next(error as Error);
    } finally {
      this.isLoadingSubject.next(false);
    }
  }

  startAutoRefresh(intervalMs: number = 5000): void {
    interval(intervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
