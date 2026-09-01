export interface HindEventPayload {
    languageIds: string;
    libraryVideo: string;
    month: string;
    gstType: string;
    daysOfWeek: string;
    youtube: string;
    interval: string;
    recordingInLibrary: string;
    facebook: string;
    zones: string; // JSON string
    donationsAllow: string;
    venueAmenities: string;
    price: string;
    endDate: string;
    mentions: string; // JSON string
    commentAllow: string;
    refundPolicy: string;
    hosts: string;
    venueImage: string;
    latitude: string;
    youtubeUrl: string;
    moderators: string;
    webLink: string;
    date: string;
    eventTypeId: string;
    longitude: string;
    startTime: string;
    totalTicket: string;
    guestAllow: string;
    maxTicketPurchase: string;
    visibility: string;
    isRecurring: string;
    streamAllOccurenece: string;
    endsAfterOccurence: string;
    eventType: string;
    duration: string;
    videoLink: string;
    payRecurring: string;
    location: string;
    keepSellingTicket: string;
    title: string;
    images: string;
    externalLiveUrl: string;
    keepSellingTicketMins: string;
    tags: string;
    timeZone: string;
    ticketVariants: string; // JSON string
    schedules: string; // JSON string
    frequency: string;
    day: string;
    description: string;
    sacCodeId: string;
    otherLocationDetails: string;
    repeatFirstTelecast: string;
    eventContent: string;
    // Internal fields for Apollo
    _organizerNames?: string;
    timezoneOffset?: string;
    endTime?: string;
    city?: string;
}
