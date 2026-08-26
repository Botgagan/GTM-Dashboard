import axios from 'axios';
import * as dotenv from 'dotenv';
import { ContactInfo } from './emailFinder';

dotenv.config();

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY;
// We no longer rely on a single hardcoded ID, we fetch dynamically by name
const FALLBACK_CAMPAIGN_ID = process.env.INSTANTLY_MASTER_CAMPAIGN_ID;

export async function pushLeadToInstantly(
    contacts: any[],
    organization: any,
    eventTitle: string,
    eventUrl: string
) {
    if (!INSTANTLY_API_KEY) {
        console.log(`\n[MOCK INSTANTLY API] Would push ${contacts.length} lead(s) for: ${organization.name}`);
        return;
    }

    // 1. Determine the clean target campaign name based on city
    let rawCity = organization.city ? organization.city.trim() : "Online";
    // Basic cleanup: if they put "New Delhi, India", just grab the first part or clean it up if needed.
    // For now, we take the first part before a comma to keep it clean (e.g., "Ahmedabad, Gujarat" -> "Ahmedabad")
    let cleanCity = rawCity.split(",")[0].trim();
    // Capitalize first letter just in case
    cleanCity = cleanCity.charAt(0).toUpperCase() + cleanCity.slice(1);
    
    const targetCampaignName = `${cleanCity} Organizers`;

    // 2. Fetch all campaigns from Instantly to find the ID
    let targetCampaignId = FALLBACK_CAMPAIGN_ID; // default fallback
    try {
        console.log(`\n🔍 Searching Instantly for campaign named: "${targetCampaignName}"...`);
        const campaignsResponse = await axios.get('https://api.instantly.ai/api/v2/campaigns', {
            headers: { 'Authorization': `Bearer ${INSTANTLY_API_KEY}` }
        });
        
        const campaigns = campaignsResponse.data?.items || [];
        const matchedCampaign = campaigns.find((c: any) => c.name.toLowerCase() === targetCampaignName.toLowerCase());

        if (matchedCampaign) {
            targetCampaignId = matchedCampaign.id;
            console.log(`✅ Found existing campaign! ID: ${targetCampaignId}`);
        } else if (FALLBACK_CAMPAIGN_ID) {
            console.log(`⚠️ Campaign "${targetCampaignName}" not found! Auto-creating by cloning Master Campaign...`);
            
            // Fetch Master Campaign to clone its templates, schedules, and variables
            const masterResponse = await axios.get(`https://api.instantly.ai/api/v2/campaigns/${FALLBACK_CAMPAIGN_ID}`, {
                headers: { 'Authorization': `Bearer ${INSTANTLY_API_KEY}` }
            });
            
            const masterData = masterResponse.data;
            
            // Prepare cloned payload
            const clonePayload = {
                name: targetCampaignName,
                campaign_schedule: masterData.campaign_schedule,
                sequences: masterData.sequences,
                email_list: masterData.email_list,
                custom_variables: masterData.custom_variables,
                core_variables: masterData.core_variables,
                email_gap: masterData.email_gap,
                daily_limit: masterData.daily_limit,
                stop_on_reply: masterData.stop_on_reply,
                link_tracking: masterData.link_tracking,
                open_tracking: masterData.open_tracking,
                match_lead_esp: masterData.match_lead_esp
            };

            // Create new Campaign
            const createResponse = await axios.post('https://api.instantly.ai/api/v2/campaigns', clonePayload, {
                headers: { 
                    'Authorization': `Bearer ${INSTANTLY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            targetCampaignId = createResponse.data?.id;
            console.log(`✨ Successfully created new cloned campaign "${targetCampaignName}" with ID: ${targetCampaignId}`);
            console.log(`💡 NOTE: The new campaign has inherited all email templates from your Master Campaign!`);
        }
    } catch (e: any) {
        console.error(`❌ Failed to fetch/create campaign in Instantly:`, e.response?.data || e.message);
    }

    // Generate all_phones comma-separated list
    const allPhones = contacts.map(c => c.phone).filter(Boolean).join(', ');

    // Push one lead per contact
    for (const contact of contacts) {
        // If contact has no email, generate a short placeholder so they still track in Instantly.
        // We use example.com and limit length to avoid Instantly's "invalid email" 64-char limit.
        const safeEmail = contact.email && contact.email.trim() !== "" 
            ? contact.email 
            : `noemail.${contact.id?.substring(0, 8) || Date.now()}@example.com`;
        
        // Try to split Name into First and Last
        const nameParts = (contact.name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        try {
            console.log(`\n🚀 Pushing ${safeEmail} to Instantly.ai Campaign (${targetCampaignId})...`);
            const response = await axios.post(
                'https://api.instantly.ai/api/v2/leads/add',
                {
                    campaign_id: targetCampaignId,
                    skip_if_in_workspace: false,
                    leads: [
                        {
                            email: safeEmail,
                            first_name: firstName,
                            last_name: lastName,
                            company_name: organization.name,
                            website: organization.website || "",
                            custom_variables: {
                                location: organization.city || "Online",
                                designation: contact.title || "",
                                event_title: eventTitle,
                                event_url: eventUrl,
                                admin_invite_link: organization.admin_invite_link || "",
                                all_emails: safeEmail,
                                all_phones: allPhones
                            }
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${INSTANTLY_API_KEY}`
                    }
                }
            );
            console.log(`✅ Successfully pushed lead! Response:`, response.data);
        } catch (e: any) {
            console.error(`❌ Failed to push lead ${safeEmail} to Instantly:`, e.response?.data || e.message);
        }
    }
}
