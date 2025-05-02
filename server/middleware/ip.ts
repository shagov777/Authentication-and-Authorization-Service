import { Request, Response, NextFunction } from 'express';
import { IPSource, ClientIP } from '../types/auth';

export function getClientIp(req: Request): ClientIP {
  const ipSource: IPSource = {
    direct: req.socket.remoteAddress,
    forwarded: typeof req.headers['x-forwarded-for'] === 'string' 
      ? [req.headers['x-forwarded-for']]
      : req.headers['x-forwarded-for'],
    proxy: req.headers['x-real-ip'] as string | undefined
  };

  // Try x-forwarded-for first (trusted proxy)
  if (ipSource.forwarded && ipSource.forwarded.length > 0) {
    const firstIp = ipSource.forwarded[0].split(',')[0].trim();
    if (isValidIp(firstIp)) return firstIp;
  }

  // Try x-real-ip (proxy)
  if (ipSource.proxy && isValidIp(ipSource.proxy)) {
    return ipSource.proxy;
  }

  // Fall back to direct socket address
  if (ipSource.direct && isValidIp(ipSource.direct)) {
    return ipSource.direct;
  }

  return null;
}

export function attachClientIp(req: Request, res: Response, next: NextFunction): void {
  req.clientIp = getClientIp(req);
  next();
}

// Type guard for IP address validation
function isValidIp(ip: string): boolean {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  // IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv6Regex.test(ip);
} 