declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const trackGtagEvent = (
  eventName: string,
  eventCategory: string,
  eventLabel: string,
) => {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, {
    event_category: eventCategory,
    event_label: eventLabel,
  });
};

