import * as moment from 'moment-timezone';

/**
 * Utility for consistent date operations in Jordan/Amman timezone
 */
export class DateUtil {
  private static readonly TIMEZONE = 'Asia/Amman';

  /**
   * Get current time in Jordan/Amman timezone
   */
  static getCurrentTime() {
    return moment().tz(this.TIMEZONE);
  }

  /**
   * Format any date to Jordan/Amman timezone
   * @param date Date object, ISO string, or any value accepted by moment
   * @param format Optional format string for output
   */
  static formatToAmmanTime(date: string | Date | moment.Moment, format?: string) {
    const momentDate = moment(date).tz(this.TIMEZONE);
    return format ? momentDate.format(format) : momentDate.format();
  }

  /**
   * Convert ISO string or Date object to moment in Jordan/Amman timezone
   */
  static toAmmanTime(date: string | Date) {
    return moment(date).tz(this.TIMEZONE);
  }

  /**
   * Format date for database (ISO format but in Amman timezone)
   */
  static formatForDb(date: string | Date | moment.Moment) {
    return moment(date).tz(this.TIMEZONE).format();
  }
} 