import { PlatformHandler } from "./router";
import { getGenericPageFunction, genericMapEvent } from "./base";

export const sortmysceneHandler: PlatformHandler = {
    name: "SortMyScene",
    domainMatch: "sortmyscene.com",
    getPageFunction: () => getGenericPageFunction(),
    mapEvent: async (scrapedEvent) => {
        // SortMyScene-specific logic (e.g. default duration is 270 minutes)
        return genericMapEvent(scrapedEvent);
    }
};
