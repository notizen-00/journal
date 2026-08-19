import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/**
 * Guards the build-time data feed. The static builder runs server-side
 * inside the worker (PRD §24 - browsers never call this API), so a shared
 * secret is enough; it is never shipped to the browser or into git (PRD §32).
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.header("x-internal-token");
    const expected = process.env.INTERNAL_API_TOKEN;

    if (!expected || token !== expected) {
      throw new UnauthorizedException("Invalid internal token");
    }
    return true;
  }
}
