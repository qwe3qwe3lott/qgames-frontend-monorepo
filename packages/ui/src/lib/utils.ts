import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';

/** Объединяет Tailwind-классы, разрешая конфликты (последний класс побеждает). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
