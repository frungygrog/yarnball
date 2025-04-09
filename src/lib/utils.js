/**
 * Utility function to conditionally join class names
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
  }
  
  /**
   * Format time in seconds to mm:ss format
   */
  export function formatTime(seconds) {
    if (!seconds) return '0:00';
    
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Generate a random ID
   */
  export function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Sanitize a filename by removing invalid characters
   */
  export function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9\s.-]/g, '').replace(/\s+/g, ' ').trim();
  }