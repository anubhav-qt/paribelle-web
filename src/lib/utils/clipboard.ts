/**
 * Clipboard utility functions
 */

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise that resolves when copy is successful
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    // Use modern Clipboard API
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      textArea.remove();
    }
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardAvailable(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * Read text from clipboard
 * @returns Promise that resolves with clipboard text
 */
export async function readFromClipboard(): Promise<string> {
  if (navigator.clipboard && window.isSecureContext) {
    return await navigator.clipboard.readText();
  }
  throw new Error('Clipboard API not available');
}
