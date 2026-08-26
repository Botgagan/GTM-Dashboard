import { PlatformHandler } from "./router";
import { getGenericPageFunction, genericMapEvent } from "./base";

export const meraeventsHandler: PlatformHandler = {
    name: "MeraEvents",
    domainMatch: "meraevents.com",
    getPageFunction: () => getGenericPageFunction(),
    mapEvent: async (scrapedEvent) => {
        return genericMapEvent(scrapedEvent);
    }
};
