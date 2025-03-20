import * as moment from 'moment-timezone';

export const DEFAULT_TIMEZONE = 'Asia/Amman';

export function toAmmanTimezone(date: Date | string | moment.Moment): moment.Moment {
  return moment(date).tz(DEFAULT_TIMEZONE);
}

export function fromAmmanTimezone(date: Date | string | moment.Moment): moment.Moment {
  return moment(date).tz(DEFAULT_TIMEZONE);
}

export function formatInAmmanTimezone(date: Date | string | moment.Moment, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return toAmmanTimezone(date).format(format);
}

export function getCurrentAmmanTime(): moment.Moment {
  return moment().tz(DEFAULT_TIMEZONE);
}

export function getAmmanDate(): Date {
  return getCurrentAmmanTime().toDate();
}

export function isAmmanTimeAfter(date1: Date | string | moment.Moment, date2: Date | string | moment.Moment): boolean {
  return toAmmanTimezone(date1).isAfter(toAmmanTimezone(date2));
}

export function isAmmanTimeBefore(date1: Date | string | moment.Moment, date2: Date | string | moment.Moment): boolean {
  return toAmmanTimezone(date1).isBefore(toAmmanTimezone(date2));
}

export function getAmmanTimeDifference(date1: Date | string | moment.Moment, date2: Date | string | moment.Moment, unit: moment.unitOfTime.Diff = 'hours'): number {
  return toAmmanTimezone(date1).diff(toAmmanTimezone(date2), unit);
} 