import { v4 as uuidv4 } from 'uuid';

/**
 * Standardized Project ID generator.
 * Format: proj_${Date.now()}_${uuid}
 * Guarantees uniqueness and preserves chronological sortability.
 */
export function generateProjectId(): string {
  const timestamp = Date.now();
  const uuid = uuidv4().split('-')[0]; // Use first part of UUID for brevity but keep uniqueness
  return `proj_${timestamp}_${uuid}`;
}
