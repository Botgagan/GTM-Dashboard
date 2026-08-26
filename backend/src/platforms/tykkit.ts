import { PlatformHandler } from "./router";
import { getGenericPageFunction, genericMapEvent } from "./base";

export const tykkitHandler: PlatformHandler = {
    name: "Tykkit",
    domainMatch: "tykkit.com",
    getPageFunction: () => getGenericPageFunction(),
    mapEvent: async (scrapedEvent) => {
        // Tykkit-specific logic (e.g. they don't have jsonLd prices)
        return genericMapEvent(scrapedEvent);
    }
};
