/**
 * The bank's page puts the widget token in the URL fragment (#token=...).
 * Fragments are never sent to servers, so the token stays out of logs.
 * We read it once and remove it from the address so it is not left in history.
 */
function readTokenOnce(): string | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('token');
  // Kept during development so a hot reload after a code change still has the token.
  if (token && import.meta.env.PROD) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return token;
}

export const sessionToken = readTokenOnce();

/** Messages to the bank page that hosts this iframe. They carry no customer data. */
type HostMessage = { type: 'salsa:resize'; height: number } | { type: 'salsa:reload' };

function tellHost(message: HostMessage) {
  if (window.parent !== window) {
    // '*' is acceptable only because these messages contain nothing private.
    window.parent.postMessage(message, '*');
  }
}

/**
 * Keeps the iframe exactly as tall as the content, so the bank page scrolls
 * naturally. Measures the content itself, not the document, because the
 * document is never shorter than the iframe and so could only ever grow.
 */
export function reportHeightToHost(content: HTMLElement) {
  const send = () =>
    tellHost({ type: 'salsa:resize', height: Math.ceil(content.getBoundingClientRect().height) });
  new ResizeObserver(send).observe(content);
  send();
}

/** Asks the bank page to reload, which gives the widget a fresh token. */
export function askHostToReload() {
  tellHost({ type: 'salsa:reload' });
}
