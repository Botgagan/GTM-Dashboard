import dotenv from 'dotenv';
import { submitEventToCohortApi } from './apiClient';
dotenv.config();

async function run() {
    const parsedPayload: any = {
      title: "Test Community Visibility Event",
      description: "Testing if COMMUNITY visibility works without 404.",
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      date: "2026-09-01",
      startTime: "10:00:00",
      visibility: "PUBLIC",
      duration: "120",
      totalTicket: "100",
      maxTicketPurchase: "10",
      latitude: 23.0225,
      longitude: 72.5714,
      location: "Test Location",
      eventType: "offline",
      price: "0",
      guestAllow: "true",
      images: "https://cdn2.allevents.in/thumbs/thumb6a82b1aa85b1c.jpg"
    };

    try {
        console.log("Submitting test event...");
        const orgId = "f2ff1c87-9f3a-4412-b77e-5667dab71dbb";
        const result = await submitEventToCohortApi(parsedPayload, orgId);
        console.log("SUCCESS!");
        console.log("Turbo URL:", `https://turbo.cohort.social/events/${result.data.eventDetails.id}`);
    } catch (e: any) {
        console.error("FAILED", e.response?.data || e.message);
    }
}

run();
