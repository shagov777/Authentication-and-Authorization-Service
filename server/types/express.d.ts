import { ClientIP } from './auth';

declare global {
  namespace Express {
    interface Request {
      clientIp: ClientIP;
    }
  }
} 