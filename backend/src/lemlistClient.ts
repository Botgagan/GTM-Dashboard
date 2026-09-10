import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const LEMLIST_API_KEY = process.env.LEMLIST_API_KEY;
const LEMLIST_MASTER_CAMPAIGN_ID = process.env.LEMLIST_MASTER_CAMPAIGN_ID;

// Cache of city campaigns to avoid constantly fetching from API
let campaignCache: { [cityName: string]: string } = {};
let hasFetchedCampaigns = false;

async function getOrCreateCityCampaign(cityName: string): Promise<string> {
    if (!LEMLIST_API_KEY || !LEMLIST_MASTER_CAMPAIGN_ID) return LEMLIST_MASTER_CAMPAIGN_ID || "";
    
    const targetName = `${cityName} Organizers`;

    // 1. Check local cache
    if (campaignCache[targetName]) {
        return campaignCache[targetName];
    }

    // 2. Fetch all campaigns if we haven't yet, to populate cache
    if (!hasFetchedCampaigns) {
        try {
            const res = await axios.get('https://api.lemlist.com/api/campaigns', {
                auth: { username: '', password: LEMLIST_API_KEY }
            });
            for (const camp of res.data) {
                if (camp.name) {
                    campaignCache[camp.name] = camp._id;
                }
            }
            hasFetchedCampaigns = true;
        } catch (e) {
            console.error("Failed to fetch Lemlist campaigns:", e);
        }
    }

    // 3. Check cache again after fetching
    if (campaignCache[targetName]) {
        return campaignCache[targetName];
    }

    // 4. If it doesn't exist, duplicate the master campaign
    console.log(`\n[LEMLIST] Campaign '${targetName}' not found. Auto-creating by duplicating Master...`);
    try {
        const res = await axios.post(
            `https://api.lemlist.com/api/campaigns/${LEMLIST_MASTER_CAMPAIGN_ID}/duplicate`,
            { name: targetName },
            { auth: { username: '', password: LEMLIST_API_KEY } }
        );
        const newCampaignId = res.data._id;
        console.log(`[LEMLIST] Successfully created city campaign: ${targetName} (${newCampaignId})`);
        
        // Save to cache
        campaignCache[targetName] = newCampaignId;
        return newCampaignId;
    } catch (e: any) {
        console.error(`[LEMLIST ERROR] Failed to duplicate campaign for ${cityName}:`, e.response?.data || e.message);
        // Fallback to master campaign if duplication fails
        return LEMLIST_MASTER_CAMPAIGN_ID;
    }
}

export async function pushLeadToLemlist(
    contacts: any[],
    organization: any,
    eventTitle: string,
    eventUrl: string
) {
    if (!LEMLIST_API_KEY || !LEMLIST_MASTER_CAMPAIGN_ID) {
        console.log(`\n[MOCK LEMLIST API] Would push ${contacts.length} lead(s) for: ${organization.name}`);
        return;
    }

    // Determine the campaign ID based on the city
    const cityName = organization.city && organization.city.trim() !== "" ? organization.city.trim() : "Online";
    const targetCampaignId = await getOrCreateCityCampaign(cityName);

    for (const contact of contacts) {
        if (!contact.email && !contact.phone) continue;

        let firstName = "";
        let lastName = "";
        if (contact.name && contact.name.trim() !== "") {
            const nameParts = contact.name.trim().split(" ");
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
        }

        const payload: any = {
            firstName: firstName,
            lastName: lastName,
            companyName: organization.name,
            organizer_name: organization.name,
            location: cityName,
            event_title: eventTitle,
            event_url: eventUrl,
            admin_invite_link: organization.admin_invite_link || "",
            org_website: organization.website || ""
        };

        if (contact.email) payload.email = contact.email;
        if (contact.phone) payload.phone = contact.phone;

        try {
            console.log(`\n-> Pushing Contact (${contact.email || contact.phone}) to Lemlist Campaign (${targetCampaignId})...`);
            const response = await axios.post(
                `https://api.lemlist.com/api/campaigns/${targetCampaignId}/leads`,
                payload,
                {
                    auth: { username: '', password: LEMLIST_API_KEY }
                }
            );
            console.log(`Success! Lead pushed to Lemlist.`);
        } catch (e: any) {
            console.error(`Failed to push lead to Lemlist:`, e.response?.data || e.message);
        }
    }
}
