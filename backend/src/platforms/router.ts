import { HindEventPayload } from "../types";
import { alleventsHandler } from "./allevents";
import { tykkitHandler } from "./tykkit";
import { sortmysceneHandler } from "./sortmyscene";
import { meraeventsHandler } from "./meraevents";

export interface PlatformHandler {
    name: string;
    domainMatch: string;
    getPageFunction: () => string;
    mapEvent: (scrapedEvent: any) => Promise<HindEventPayload | null>;
}

const handlers: PlatformHandler[] = [
    alleventsHandler,
    tykkitHandler,
    sortmysceneHandler,
    meraeventsHandler
];

export function getPlatformHandler(url: string): PlatformHandler | null {
    for (const handler of handlers) {
        if (url.toLowerCase().includes(handler.domainMatch)) {
            return handler;
        }
    }
    return null;
}
