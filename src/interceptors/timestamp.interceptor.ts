import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateUtil } from '../utils/date.util';

/**
 * Interceptor to transform all Date objects in the response to Amman timezone
 */
@Injectable()
export class TimestampInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        return this.transformDates(data);
      }),
    );
  }

  private transformDates(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      return DateUtil.formatToAmmanTime(data);
    }

    if (typeof data === 'object') {
      if (Array.isArray(data)) {
        return data.map(item => this.transformDates(item));
      }

      const result = { ...data };
      for (const key of Object.keys(result)) {
        const value = result[key];
        if (value instanceof Date) {
          result[key] = DateUtil.formatToAmmanTime(value);
        } else if (
          typeof value === 'string' && 
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)
        ) {
          // Convert ISO string dates to Amman timezone
          result[key] = DateUtil.formatToAmmanTime(value);
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.transformDates(value);
        }
      }
      return result;
    }

    return data;
  }
} 