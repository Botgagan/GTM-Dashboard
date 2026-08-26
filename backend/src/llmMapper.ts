import { HindEventPayload } from "./types";
import { getPlatformHandler } from "./platforms/router";
import { genericMapEvent } from "./platforms/base";

export async function mapEventWithLLM(scrapedEvent: any): Promise<HindEventPayload | null> {
    const handler = getPlatformHandler(scrapedEvent.url || "");
    if (handler) {
        return handler.mapEvent(scrapedEvent);
    }
    // Fallback if domain isn't in router yet
    return genericMapEvent(scrapedEvent);
}
