/** The homepage unboxing intro ("Tear open the drop") and the hero coordinate through one window event. */
export const INTRO_EVT = "ba:intro";
/** shirt: the tee starts coming out of the package · hero: the hero choreography starts · skip: jump to the end. */
export type IntroPhase = "shirt" | "hero" | "skip";

const KEY = "ba-intro-seen";

/**
 * Runs inline before first paint (see app/page.tsx): marks <body data-intro="on"> when the intro should play —
 * once per browser session, never with reduced motion — so the package covers the hero from the very first frame.
 */
export const INTRO_BOOT = `try{if((!sessionStorage.getItem("${KEY}")||/[?&]intro\\b/.test(location.search))&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.body.dataset.intro="on";history.scrollRestoration="manual";scrollTo({top:0,behavior:"instant"});sessionStorage.setItem("${KEY}","1")}}catch(e){}`;

export const introActive = () => typeof document !== "undefined" && document.body.dataset.intro === "on";

export const sendIntro = (phase: IntroPhase) => window.dispatchEvent(new CustomEvent<IntroPhase>(INTRO_EVT, { detail: phase }));
