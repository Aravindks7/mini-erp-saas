import { format } from 'date-fns';

/**
 * Formats a date to dd/MM/yyyy.
 * @param date - The date to format (Date object or ISO string).
 * @returns The formatted date string.
 */
export const formatDate = (date: Date | string | number) => {
  return format(new Date(date), 'dd/MM/yyyy');
};

/**
 * Formats a date to a full display format (PPP p from date-fns).
 * @param date - The date to format (Date object or ISO string).
 * @returns The formatted date string.
 */
export const formatFullDate = (date: Date | string | number) => {
  return format(new Date(date), 'PPP p');
};
