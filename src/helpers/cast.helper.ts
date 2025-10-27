interface ToNumberOptions {
    default?: number;
    min?: number;
    max?: number;
  }
  
  export function toLowerCase(value: string): string {
    return value.toLowerCase();
  }
  
  export function trim(value: string): string {
    return value.trim();
  }
  
  export function toDate(value: string): Date {
    return new Date(value);
  }
  
  export function toBoolean(value: string): boolean {
    value = value.toLowerCase();
  
    return value === 'true' || value === '1' ? true : false;
  }
  
export function toNumber(value: string | any, opts: ToNumberOptions = {}): number {
  // Handle class-transformer v0.5+ which passes an object with { value, key, obj, ... }
  const actualValue = typeof value === 'object' && value !== null && 'value' in value 
    ? value.value 
    : value;
  
  let newValue: number = Number.parseInt(actualValue || String(opts.default), 10);

  if (Number.isNaN(newValue)) {
    newValue = opts.default;
  }

  if (opts.min) {
    if (newValue < opts.min) {
      newValue = opts.min;
    }

    if (newValue > opts.max) {
      newValue = opts.max;
    }
  }

  return newValue;
}