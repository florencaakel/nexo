/** Set only by the static browser build. The Sites/Worker build stays unchanged. */
declare const __NEXO_BROWSER_DEMO__: boolean | undefined;
export const BROWSER_DEMO = typeof __NEXO_BROWSER_DEMO__ !== 'undefined' && __NEXO_BROWSER_DEMO__ === true;
