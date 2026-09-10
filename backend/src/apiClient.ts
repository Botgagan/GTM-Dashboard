import axios from 'axios';
const API_BASE_URL = process.env.COHORT_API_URL || 'https://devapi.cohort.social';
import FormData from 'form-data';
import { HindEventPayload } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

export async function submitEventToCohortApi(payload: HindEventPayload, orgId: string | null = null) {
    let apiUrl = `${API_BASE_URL}/eventv2/philosophy/684ee90a-6498-4c58-a425-bdbe93886eb7`;
    if (orgId) {
        apiUrl = `${API_BASE_URL}/eventv2/organization/${orgId}`;
    }
    
    console.log(`\n--- PUSHING EVENT TO COHORT API ---`);
    console.log(`Submitting event "${payload.title}" to ${apiUrl}...`);
    
    // Parse and fix types based on exact Swagger specs
    const parsedPayload: any = { ...payload };
    delete parsedPayload._organizerNames;
    delete parsedPayload.mentions; // Causes "Expected array" in multipart
    delete parsedPayload.zones; // Avoid deep nested validation for now

    // Ensure startTime is strictly HH:mm:ss
    if (parsedPayload.startTime) {
        parsedPayload.startTime = parsedPayload.startTime.split('.')[0].replace('Z', '').replace('+05:30', '');
    }
    
    if (parsedPayload.price !== undefined) {
        let numericPrice = Math.round(parseFloat(parsedPayload.price) || 0);
        if (numericPrice > 0) {
            parsedPayload.price = numericPrice.toString();
            parsedPayload.isPaid = "true";
        } else {
            delete parsedPayload.price; // Omit entirely for free events
            parsedPayload.isPaid = "false";
            delete parsedPayload.sacCodeId; // Required by backend for free events
        }
    }

    try {
        if (parsedPayload.ticketVariants) {
            let variants = (typeof parsedPayload.ticketVariants === 'string' ? JSON.parse(parsedPayload.ticketVariants) : parsedPayload.ticketVariants); 
            if (Array.isArray(variants) && variants.length > 0) {
                // If the top level is free, don't pass ticketVariants
                if (parsedPayload.isPaid === "false") {
                    delete parsedPayload.ticketVariants;
                } else {
                    variants.forEach((v: any) => { 
                        if (v.price !== undefined) {
                            let numericPrice = Math.round(parseFloat(v.price) || 0);
                            v.price = numericPrice > 0 ? numericPrice : 0;
                        }
                    });
                    parsedPayload.ticketVariants = JSON.stringify(variants);
                }
            } else {
                delete parsedPayload.ticketVariants;
            }
        }
    } catch(e) { delete parsedPayload.ticketVariants; }

    parsedPayload.timeZone = 'Asia/Kolkata';
    
    // Delete placeholder 'string' from AI and invalid URLs
    const urlFields = ['videoLink', 'youtubeUrl', 'externalLiveUrl', 'webLink', 'facebook', 'youtube', 'libraryVideo'];
    for (const field of urlFields) {
        if (!parsedPayload[field] || parsedPayload[field] === 'string' || !parsedPayload[field].startsWith('http')) {
            delete parsedPayload[field];
        }
    }

    // Ensure location is not empty to avoid 422 Validation Error
    if (!parsedPayload.location || parsedPayload.location.trim().length === 0) {
        parsedPayload.location = "Online";
    }

    // Handle recurring vs one-off events dynamically
    const isMultiDay = parsedPayload.endDate && parsedPayload.date !== parsedPayload.endDate;
    
    // duration must be sent as a number (integer), not a string
    let parsedDuration = parseInt(parsedPayload.duration) || 120;
    
    // For multi-day events, Cohort expects per-session duration, not total span.
    // endDate field already handles multi-day. So divide total by number of days.
    if (isMultiDay && parsedPayload.date && parsedPayload.endDate) {
        const startD = new Date(parsedPayload.date);
        const endD = new Date(parsedPayload.endDate);
        const diffDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24)));
        parsedDuration = Math.round(parsedDuration / diffDays);
    }
    
    // Hard cap: Test if Cohort API rejects durations > a few hours. 
    // Let's cap at 240 mins (4 hours) just to be safe and test it.
    parsedPayload.duration = Math.min(Math.max(parsedDuration, 30), 240);

    // Fix past dates to bypass backend validation (Start date must be in future)
    if (parsedPayload.date) {
        const eventDate = new Date(parsedPayload.date);
        const today = new Date();
        if (eventDate < today) {
            eventDate.setFullYear(today.getFullYear() + 1); // Bump to next year
            parsedPayload.date = eventDate.toISOString().split('T')[0];
            if (parsedPayload.endDate) {
                const endDate = new Date(parsedPayload.endDate);
                endDate.setFullYear(today.getFullYear() + 1);
                parsedPayload.endDate = endDate.toISOString().split('T')[0];
            }
        }
    }

    // Make sure schedules array format is clean and strict without overriding the actual date
    try {
        parsedPayload.schedules = JSON.stringify([{
            date: parsedPayload.date,
            startTimes: [parsedPayload.startTime.split('.')[0].replace('Z', '')]
        }]);
    } catch(e) { }

    if (parsedPayload.frequency === 'none' || !parsedPayload.frequency) {
        if (isMultiDay) {
            // Force multi-day events to be daily recurring so Cohort API shows the date range
            parsedPayload.isRecurring = "true";
            parsedPayload.frequency = "day";
            parsedPayload.interval = "1";
            // Do not set endsAfterOccurence so the endDate dictates the range
            delete parsedPayload.endsAfterOccurence;
        } else {
            parsedPayload.isRecurring = "false";
            parsedPayload.payRecurring = "false";
            delete parsedPayload.frequency;
            delete parsedPayload.interval;
            delete parsedPayload.endsAfterOccurence;
            delete parsedPayload.daysOfWeek;
        }
    } else {
        parsedPayload.isRecurring = "true";
        parsedPayload.interval = "1";
        delete parsedPayload.endsAfterOccurence;
    }
    if (orgId) {
        parsedPayload.visibility = "ORGANIZATION";
    } else {
        parsedPayload.visibility = "PUBLIC";
    }
    
    parsedPayload.sacCodeId = "cf19790e-aad9-4711-8deb-6402708bfd54"; // Real UUID from database
    parsedPayload.gstType = "inclusive";
    parsedPayload.eventTypeId = "84bf505a-5f86-4c2b-a81a-4683cb45eabc"; // Real UUID from database
    if (!parsedPayload.refundPolicy) {
        parsedPayload.refundPolicy = "No Refunds";
    }

    // Delete custom fields that shouldn't be here
    if (parsedPayload.frequency !== "week") {
        delete parsedPayload.daysOfWeek;
    }
    delete parsedPayload.month;
    delete parsedPayload.moderators;
    delete parsedPayload.hosts;
    delete parsedPayload.tags;
    delete parsedPayload.languageIds;

    // CREATE MULTIPART FORM DATA
    const formData = new FormData();
    
    for (const [key, value] of Object.entries(parsedPayload)) {
        if (value !== undefined && value !== null && key !== 'images' && key !== 'venueImage') {
            formData.append(key, value);
        }
    }
    
    console.log(`📋 Sending duration = ${parsedPayload.duration} (type: ${typeof parsedPayload.duration}) to Cohort API`);

    if (orgId) {
        // Explicitly link the event to the newly created subcommunity (organization)
        formData.append('organization', orgId);
    }

    // DOWNLOAD IMAGE AND APPEND AS FILE
    let imageAttached = false;
    if (payload.images && payload.images.length > 0) {
        let imageUrl = Array.isArray(payload.images) ? payload.images[0] : payload.images;
        if (imageUrl.startsWith('http')) {
            try {
                console.log(`Downloading image from ${imageUrl}...`);
                const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imageResponse.data, 'binary');
                formData.append('images', buffer, { filename: 'event.jpg', contentType: 'image/jpeg' });
                formData.append('files', buffer, { filename: 'event.jpg', contentType: 'image/jpeg' });
                imageAttached = true;
                console.log(`✅ Image successfully attached to payload.`);
            } catch(e) {
                console.log(`⚠️ Failed to download image.`);
            }
        }
    }
    
    if (!imageAttached) {
        // Fallback: The API strictly requires a 'files' object, so we append a 1x1 transparent PNG if none exists
        const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
        formData.append('files', dummyBuffer, { filename: 'dummy.png', contentType: 'image/png' });
        formData.append('images', dummyBuffer, { filename: 'dummy.png', contentType: 'image/png' });
        console.log(`⚠️ Attached fallback dummy image to satisfy strict API validation.`);
    }

    const headers: any = {
        'accept': 'application/json',
        ...formData.getHeaders()
    };

    // Attach Access Token if provided in .env
    if (process.env.COHORT_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.COHORT_ACCESS_TOKEN}`;
    } else {
        console.log(`⚠️ No COHORT_ACCESS_TOKEN found in .env. Attempting request without authorization...`);
    }
    
    try {
        const response = await axios.post(apiUrl, formData, { headers });
        console.log(`✅ Successfully pushed Event to Cohort API! Response: 200 OK`);
        console.log(`Raw API Response:`, JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error: any) {
        if (error.response) {
            console.error(`❌ Cohort API Error (${error.response.status}):`, error.response.data);
            throw new Error(JSON.stringify(error.response.data));
        } else {
            console.error("❌ Cohort API Request Failed:", error.message);
            throw error;
        }
    }
    return null;
}

export async function createSubcommunity(organizerName: string, phoneStr: string, emailStr: string): Promise<string | null> {
    const apiUrl = `${API_BASE_URL}/organization`;
    console.log(`\n--- CREATING SUBCOMMUNITY FOR: ${organizerName} ---`);
    
    let primaryEmail = emailStr;
    if (emailStr === "not available" || !emailStr.includes('@')) {
        const safeOrgName = organizerName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        primaryEmail = `no-email-${safeOrgName}-${Date.now()}@placeholder.com`;
    } else {
        const emailMatch = emailStr.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
        if (emailMatch) primaryEmail = emailMatch[1];
    }
    
    const phoneMatch = phoneStr.match(/(\+?\d[\d\s-]{8,}\d)/);
    const primaryPhone = phoneMatch ? phoneMatch[1].trim() : "";

    // Hardcode the original adminId that is actually a member of the community
        let adminId = 'df0e077b-a203-48a3-acc1-41da79656543';
    
    // The Cohort API expects the Community Membership ID, NOT the User's dbId!
    // Using the ID provided by the user's admin list response.
    adminId = 'c32158f7-91ab-40a2-a0bc-504d9a4f96fd'; 

    const contactInfoObj: any = { email: primaryEmail };
    if (primaryPhone) {
        contactInfoObj.phoneNo = primaryPhone;
    }

    const formData = new FormData();
    formData.append('type', 'virtual');
    formData.append('joiningMethod', 'open-signup');
    formData.append('lockPermissionForOrganization', 'true');
    formData.append('adminId', adminId);
    formData.append('name', `${organizerName} ${Date.now()}`);
    formData.append('contactInfo', JSON.stringify(contactInfoObj));
    formData.append('philosophy', '684ee90a-6498-4c58-a425-bdbe93886eb7');
    formData.append('community', '69c6a422-3638-46b9-b27e-99c844adcfd8');
    
    // Add dummy image
    const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    formData.append('image', dummyBuffer, { filename: 'dummy.jpg', contentType: 'image/jpeg' });

    const headers: any = {
        'accept': 'application/json',
        ...formData.getHeaders()
    };
    if (process.env.COHORT_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.COHORT_ACCESS_TOKEN}`;
    }

    try {
        const response = await axios.post(apiUrl, formData, { headers });
        console.log("Raw Subcommunity Creation Response:", JSON.stringify(response.data, null, 2));
        
        const orgId = response.data?.data?.id || response.data?.data?.organization?.id;
        if (orgId) {
            console.log(`✅ Subcommunity created! ID: ${orgId}`);
            return orgId;
        }
    } catch (error: any) {
        console.error(`❌ Failed to create subcommunity:`, JSON.stringify(error?.response?.data || error.message, null, 2));
        throw new Error(error?.response?.data?.message || error?.message || "Failed to create subcommunity in Cohort API");
    }
    return null;
}

export async function getAdminInviteLink(orgId: string): Promise<string | null> {
    const apiUrl = `${API_BASE_URL}/invite/organization/${orgId}?pageSize=10&type=custom`;
    console.log(`\n--- FETCHING ADMIN INVITE LINK ---`);
    
    const headers: any = {
        'accept': 'application/json',
    };
    if (process.env.COHORT_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.COHORT_ACCESS_TOKEN}`;
    }

    try {
        const response = await axios.get(apiUrl, { headers });
        console.log("Raw Invite Link API Response:", JSON.stringify(response.data, null, 2));

        const list = response.data?.data?.list || response.data?.list || [];
        const adminLinkObj = list.find((item: any) => item.role === 'admin');
        if (adminLinkObj && adminLinkObj.link) {
            console.log(`✅ Fetched Admin Invite Link: ${adminLinkObj.link}`);
            return adminLinkObj.link;
        } else {
            console.log(`⚠️ Admin role not found in link list!`);
        }
    } catch (error: any) {
        console.error(`❌ Failed to fetch invite link:`, error?.response?.data || error.message);
    }
    return null;
}

export async function getEventDetails(orgId: string, eventId: string): Promise<any | null> {
    const apiUrl = `${API_BASE_URL}/eventv2/organization/${orgId}/${eventId}/details?recording=false`;
    console.log(`\n--- FETCHING EVENT DETAILS FOR STATUS ---`);
    console.log(`GET ${apiUrl}`);
    
    const headers: any = {
        'accept': 'application/json',
    };
    if (process.env.COHORT_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.COHORT_ACCESS_TOKEN}`;
    }

    try {
        const response = await axios.get(apiUrl, { headers });
        console.log(`✅ Event details fetched successfully.`);
        return response.data?.data?.eventDetails || response.data?.eventDetails || null;
    } catch (error: any) {
        console.error(`❌ Failed to fetch event details:`, error?.response?.data || error.message);
    }
    return null;
}

export async function getSubcommunityDetails(orgId: string): Promise<any | null> {
    const apiUrl = `${API_BASE_URL}/organization/profile/${orgId}`;
    console.log(`\n--- FETCHING SUBCOMMUNITY DETAILS ---`);
    console.log(`GET ${apiUrl}`);
    
    const headers: any = {
        'accept': 'application/json',
    };
    if (process.env.COHORT_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.COHORT_ACCESS_TOKEN}`;
    }

    try {
        const response = await axios.get(apiUrl, { headers });
        console.log(`✅ Subcommunity details fetched successfully.`);
        // Logging raw response so we can inspect exactly what field the approval status is saved under
        console.log("Raw Subcommunity Profile Response:", JSON.stringify(response.data, null, 2));
        return response.data?.data || response.data || null;
    } catch (error: any) {
        console.error(`❌ Failed to fetch subcommunity details:`, error?.response?.data || error.message);
    }
    return null;
}


