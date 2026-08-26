import { PlatformHandler } from "./router";
import { getGenericPageFunction, genericMapEvent } from "./base";

export const alleventsHandler: PlatformHandler = {
    name: "AllEvents",
    domainMatch: "allevents.in",
    getPageFunction: () => getGenericPageFunction(),
    mapEvent: async (scrapedEvent) => {
        // You can add AllEvents-specific mapping logic here before or after calling genericMapEvent
        return genericMapEvent(scrapedEvent);
    }
};
