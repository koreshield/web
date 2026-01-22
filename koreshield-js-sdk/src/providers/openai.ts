/**
 * OpenAI-compatible wrapper for KoreShield
 * Provides drop-in replacement for OpenAI SDK
 */

import { KoreShieldClient } from '../core/client';
import {
  KoreShieldConfig,
  SecurityOptions,
  ChatCompletionRequest
} from '../types';

export class KoreShieldOpenAI {
  private client: KoreShieldClient;

  constructor(config: KoreShieldConfig) {
    this.client = new KoreShieldClient(config);
  }

  /**
   * Chat completions API (OpenAI-compatible)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async chat(_completions: any) {
    return {
      create: async (request: ChatCompletionRequest, securityOptions?: SecurityOptions) => {
        return await this.client.createChatCompletion(request, securityOptions);
      }
    };
  }

  /**
   * Get underlying KoreShield client for advanced operations
   */
  getClient(): KoreShieldClient {
    return this.client;
  }
}

/**
 * Factory function to create OpenAI-compatible instance
 */
export function createKoreShieldOpenAI(config: KoreShieldConfig): KoreShieldOpenAI {
  return new KoreShieldOpenAI(config);
}