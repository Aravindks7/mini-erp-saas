import * as React from 'react';

/**
 * Evaluates the client operating system to return the appropriate
 * keyboard modifier string. Defers to a stateful implementation
 * to ensure extensibility if SSR is introduced.
 */
export function useModifierKey(): string {
  const [modifierKey, setModifierKey] = React.useState<string>('⌘');

  React.useEffect(() => {
    // Defense-in-depth: Ensure we are in a browser environment
    if (typeof window === 'undefined') return;

    // Modern browsers support userAgentData, legacy browsers rely on platform/userAgent
    const isMac =
      // @ts-expect-error - userAgentData is not yet fully typed in standard DOM lib
      navigator.userAgentData?.platform?.toLowerCase().includes('mac') ||
      navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
      /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);

    setModifierKey(isMac ? '⌘' : 'Ctrl');
  }, []);

  return modifierKey;
}
