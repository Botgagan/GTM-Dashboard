import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const LEMLIST_API_KEY = process.env.LEMLIST_API_KEY;
const LEMLIST_MASTER_CAMPAIGN_ID = process.env.LEMLIST_MASTER_CAMPAIGN_ID;

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

    // Since Lemlist automatically skips missing steps (e.g. skips email step if no email, 
    // skips whatsapp step if no phone), we can safely push ALL contacts!
    for (const contact of contacts) {
        // Only push if they have at least an email or a phone
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
            location: organization.city || "Online",
            event_title: eventTitle,
            event_url: eventUrl,
            admin_invite_link: organization.admin_invite_link || ""
        };

        if (contact.email) payload.email = contact.email;
        if (contact.phone) payload.phone = contact.phone;

        try {
            console.log(`\n-> Pushing Contact (${contact.email || contact.phone}) to Lemlist Campaign...`);
            const response = await axios.post(
                `https://api.lemlist.com/api/campaigns/${LEMLIST_MASTER_CAMPAIGN_ID}/leads`,
                payload,
                {
                    auth: {
                        username: '',
                        password: LEMLIST_API_KEY
                    }
                }
            );
            console.log(`Success! Lead pushed to Lemlist.`);
        } catch (e: any) {
            console.error(`Failed to push lead to Lemlist:`, e.response?.data || e.message);
        }
    }
}
