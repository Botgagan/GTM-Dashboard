import { HindEventPayload } from './types';
import { v4 as uuidv4 } from 'uuid';

export function mapAllEventsToHindSchema(scrapedEvent: any): HindEventPayload {
    const dummyUuid = uuidv4();
    const ld = scrapedEvent.jsonLd || {};
    
    // Parse Dates
    let date = "2026-08-15";
    let endDate = "2026-08-15";
    let startTime = "06:00:00Z";
    let duration = "120"; // default
    
    if (ld.startDate) {
        const startSplit = ld.startDate.split('T');
        date = startSplit[0];
        if (startSplit[1]) {
            startTime = startSplit[1].replace('+05:30', 'Z'); // simplifying timezone
        }
    }
    
    // Create Date object for calculating month and day fields
    const dateObj = date ? new Date(date) : null;
    
    if (ld.endDate) {
        const endSplit = ld.endDate.split('T');
        endDate = endSplit[0];
    }
    
    // Parse Location
    let latitude = "string";
    let longitude = "string";
    let locationName = "Ahmedabad";
    if (ld.location) {
        if (ld.location.name) locationName = ld.location.name;
        if (ld.location.geo) {
            latitude = ld.location.geo.latitude || "string";
            longitude = ld.location.geo.longitude || "string";
        }
    }

    // Parse Organizer
    let organizerName = "Unknown Organizer";
    if (ld.organizer && ld.organizer.length > 0) {
        organizerName = ld.organizer[0].name || organizerName;
    } else if (ld.organizer && ld.organizer.name) {
        organizerName = ld.organizer.name;
    }

    // Parse Tickets/Prices
    let lowestPrice = "0";
    let ticketVariants = [];
    if (ld.offers && Array.isArray(ld.offers)) {
        ld.offers.forEach((offer: any) => {
            if (offer.price && offer.name) {
                ticketVariants.push({
                    name: offer.name,
                    description: "Standard Entry",
                    price: offer.price,
                    quantity: 100,
                    maxTicketPerUser: 10,
                    ticketType: "single_ticket"
                });
            } else if (offer.lowPrice) {
                lowestPrice = offer.lowPrice;
            }
        });
    }

    // Fallback if no ticket variants found
    if (ticketVariants.length === 0) {
        ticketVariants.push({
            name: "General Admission",
            description: "Standard Entry",
            price: lowestPrice,
            quantity: 100,
            maxTicketPerUser: 10,
            ticketType: "single_ticket"
        });
    }

    // Formatting zones array
    const zones = [[{
        name: "General",
        zoneType: "sitting",
        tickets: ticketVariants
    }]];

    const title = ld.name || scrapedEvent.title || "Untitled Event";
    const imageUrl = ld.image || scrapedEvent.imageUrl || "string";
    const description = ld.description || scrapedEvent.eventContent || "No description provided.";
    
    return {
        languageIds: dummyUuid,
        libraryVideo: dummyUuid,
        month: dateObj ? dateObj.toLocaleString('en-US', { month: 'long' }) : "string",
        gstType: "inclusive",
        daysOfWeek: dateObj ? dateObj.toLocaleString('en-US', { weekday: 'long' }) : "string",
        youtube: "true",
        interval: "string",
        recordingInLibrary: "true",
        facebook: "true",
        zones: JSON.stringify(zones),
        donationsAllow: "true",
        venueAmenities: "string",
        price: lowestPrice,
        endDate: endDate,
        mentions: JSON.stringify([]),
        commentAllow: "true",
        refundPolicy: "No Refunds",
        hosts: dummyUuid,
        venueImage: imageUrl,
        latitude: latitude,
        youtubeUrl: "string",
        moderators: dummyUuid,
        webLink: scrapedEvent.url || "string",
        date: date,
        eventTypeId: dummyUuid,
        longitude: longitude,
        startTime: startTime,
        totalTicket: "100",
        guestAllow: "true",
        maxTicketPurchase: "10",
        visibility: "string",
        isRecurring: "true",
        streamAllOccurenece: "true",
        endsAfterOccurence: "string",
        eventType: "live",
        duration: duration,
        videoLink: "string",
        payRecurring: "true",
        location: locationName,
        keepSellingTicket: "true",
        title: title,
        images: imageUrl,
        externalLiveUrl: "string",
        keepSellingTicketMins: "string",
        tags: dummyUuid,
        timeZone: "string",
        ticketVariants: JSON.stringify(ticketVariants),
        schedules: JSON.stringify([{
            date: date,
            startTimes: [startTime]
        }]),
        frequency: "day",
        day: dateObj ? dateObj.getDate().toString() : "string",
        description: description.substring(0, 1000),
        sacCodeId: dummyUuid,
        otherLocationDetails: "string",
        repeatFirstTelecast: "true",
        eventContent: scrapedEvent.eventContent || description,
        
        // Pass organizer to output
        _organizerNames: organizerName
    };
}
