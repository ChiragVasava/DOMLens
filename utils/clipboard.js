/**
 * Website Inspector AI - Clipboard Utility
 * 
 * Provides safe text copy to clipboard functionality across chrome extension environments.
 */

/**
 * Copies text string to clipboard asynchronously with fallback support
 * @param {string} text 
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('[Website Inspector AI] navigator.clipboard failed, attempting execCommand fallback', err);
  }

  // Fallback method using temporary textarea element
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('[Website Inspector AI] Fallback copy failed:', err);
    return false;
  }
}
