const axios = require('axios');
require('dotenv').config();

async function pushManual() {
    const payload = {
        languageIds: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        libraryVideo: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        month: "October",
        gstType: "inclusive",
        daysOfWeek: "[]",
        youtube: "true",
        interval: "1",
        recordingInLibrary: "true",
        facebook: "true",
        zones: "[[{\"name\":\"General\",\"zoneType\":\"sitting\",\"tickets\":[{\"name\":\"General Admission\",\"description\":\"Standard Entry\",\"price\":1199,\"quantity\":100,\"maxTicketPerUser\":10,\"ticketType\":\"single_ticket\"}]}]]",
        donationsAllow: "true",
        venueAmenities: "",
        price: "1199",
        endDate: "2026-10-20",
        mentions: "[]",
        commentAllow: "false",
        refundPolicy: "No Refunds",
        hosts: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        venueImage: "https://cdn.district.in/assets/events/publisher/event_cover_image_horizontal/01KY7CTZZST0W4ZR7VYAXJGBM9.jpg",
        latitude: 0,
        youtubeUrl: "",
        moderators: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        webLink: "https://www.district.in/events/raatladi--city-of-dreams-buy-tickets",
        date: "2026-10-11",
        eventTypeId: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        longitude: 0,
        startTime: "21:00:00",
        totalTicket: "100",
        guestAllow: "true",
        maxTicketPurchase: "10",
        visibility: "PUBLIC",
        isRecurring: "true",
        streamAllOccurenece: "true",
        endsAfterOccurence: "",
        eventType: "offline",
        duration: "1440",
        videoLink: "",
        payRecurring: "true",
        location: "Venue to be announced",
        keepSellingTicket: "true",
        title: "Raatladi",
        images: "https://cdn.district.in/assets/events/publisher/event_cover_image_horizontal/01KY7CTZZST0W4ZR7VYAXJGBM9.jpg",
        externalLiveUrl: "",
        keepSellingTicketMins: "10",
        tags: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        timeZone: "Asia/Kolkata",
        ticketVariants: "[{\"name\":\"General Admission\",\"description\":\"Standard Entry\",\"price\":1199,\"quantity\":100,\"maxTicketPerUser\":10,\"ticketType\":\"single_ticket\"}]",
        schedules: "[{\"date\":\"2026-10-11\",\"startTimes\":[\"21:00:00\"]}]",
        frequency: "day",
        month: "",
        day: "11-20 October 2026",
        description: "Raatladi’26 is a premium Navratri celebration that brings together the perfect blend of tradition, culture, music, and entertainment. Experience the authentic spirit of Mandli Garba, featuring live performances by renowned Mandli artists, vibrant Garba, exceptional hospitality, delicious food, and an unforgettable festive atmosphere.Join thousands of Garba enthusiasts for nine spectacular nights filled with culture, devotion, celebration, and memories that will last a lifetime.",
        sacCodeId: "bf41e563-4c90-4a76-92aa-9ef67bdf9851",
        otherLocationDetails: "",
        repeatFirstTelecast: "true",
        eventContent: "Buy Tickets for Raatladi | City Of Dreams!",
        _organizerNames: "[\"Search Media\"]"
    };

    try {
        const formData = new FormData();
        for (const [key, value] of Object.entries(payload)) {
            formData.append(key, value);
        }
        
        // Add fake image blob
        const imgBuffer = await axios.get(payload.images, { responseType: 'arraybuffer' }).then(res => res.data);
        const blob = new Blob([imgBuffer], { type: 'image/jpeg' });
        formData.append('images', blob, 'event.jpg');

        const res = await axios.post('https://devapi.cohort.social/eventv2/philosophy/684ee90a-6498-4c58-a425-bdbe93886eb7', formData, {
            headers: {
                Authorization: `Bearer ${process.env.COHORT_ACCESS_TOKEN}`,
                'Content-Type': 'multipart/form-data',
            }
        });
        console.log("SUCCESS!", res.data.data.eventDetails.id);
    } catch(e) {
        console.error("FAIL", e.response?.data || e.message);
    }
}
pushManual();
