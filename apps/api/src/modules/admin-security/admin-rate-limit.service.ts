import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { FastifyReply } from "fastify";

type RateLimitDimension = {
  label: string;
  value: string | null | undefined;
  maxAttempts: number;
};

type RateLimitPolicy = {
  scope: string;
  windowSeconds: number;
  blockSeconds: number;
  message: string;
  dimensions: RateLimitDimension[];
};

type RateLimitState = {
  attempts: number;
  windowStartedAt: number;
  blockedUntil: number;
  lastSeenAt: number;
};

@Injectable()
export class AdminRateLimitService {
  private readonly logger = new Logger(AdminRateLimitService.name);
  private readonly state = new Map<string, RateLimitState>();
  private readonly retentionMs = 24 * 60 * 60 * 1000;

  consume(policy: RateLimitPolicy, reply?: FastifyReply) {
    const now = Date.now();
    this.prune(now);

    const dimensions = policy.dimensions.filter(
      (dimension) =>
        typeof dimension.value === "string" &&
        dimension.value.trim().length > 0,
    );

    if (dimensions.length === 0) {
      this.logger.warn(
        `Rate limit policy ${policy.scope} was evaluated without identifiers.`,
      );
      return;
    }

    let retryAfterSeconds = 0;

    for (const dimension of dimensions) {
      const key = this.buildKey(
        policy.scope,
        dimension.label,
        dimension.value!,
      );
      const current = this.readState(key, now);

      if (current.blockedUntil > now) {
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          Math.ceil((current.blockedUntil - now) / 1000),
        );
      }
    }

    if (retryAfterSeconds > 0) {
      this.throwRateLimit(policy.message, retryAfterSeconds, reply);
    }

    for (const dimension of dimensions) {
      const key = this.buildKey(
        policy.scope,
        dimension.label,
        dimension.value!,
      );
      const current = this.readState(key, now);

      if (now - current.windowStartedAt >= policy.windowSeconds * 1000) {
        current.attempts = 0;
        current.windowStartedAt = now;
      }

      current.attempts += 1;
      current.lastSeenAt = now;

      if (current.attempts > dimension.maxAttempts) {
        current.blockedUntil = now + policy.blockSeconds * 1000;
        retryAfterSeconds = Math.max(
          retryAfterSeconds,
          Math.ceil((current.blockedUntil - now) / 1000),
        );
      }

      this.state.set(key, current);
    }

    if (retryAfterSeconds > 0) {
      this.throwRateLimit(policy.message, retryAfterSeconds, reply);
    }
  }

  reset(
    scope: string,
    dimensions: Array<Pick<RateLimitDimension, "label" | "value">>,
  ) {
    for (const dimension of dimensions) {
      if (
        typeof dimension.value !== "string" ||
        dimension.value.trim().length === 0
      ) {
        continue;
      }

      this.state.delete(
        this.buildKey(scope, dimension.label, dimension.value.trim()),
      );
    }
  }

  private buildKey(scope: string, label: string, value: string) {
    return `${scope}:${label}:${value.trim().toLowerCase()}`;
  }

  private readState(key: string, now: number): RateLimitState {
    const existing = this.state.get(key);

    if (!existing) {
      return {
        attempts: 0,
        windowStartedAt: now,
        blockedUntil: 0,
        lastSeenAt: now,
      };
    }

    if (
      existing.blockedUntil <= now &&
      now - existing.windowStartedAt >= this.retentionMs
    ) {
      return {
        attempts: 0,
        windowStartedAt: now,
        blockedUntil: 0,
        lastSeenAt: now,
      };
    }

    return existing;
  }

  private prune(now: number) {
    for (const [key, current] of this.state.entries()) {
      if (
        current.blockedUntil <= now &&
        now - current.lastSeenAt >= this.retentionMs
      ) {
        this.state.delete(key);
      }
    }
  }

  private throwRateLimit(
    message: string,
    retryAfterSeconds: number,
    reply?: FastifyReply,
  ): never {
    reply?.header("Retry-After", retryAfterSeconds.toString());
    throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}
