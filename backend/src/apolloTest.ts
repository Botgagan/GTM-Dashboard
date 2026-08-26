import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

export async function searchApolloForOrganizer(organizerName: string) {
    if (!APOLLO_API_KEY || APOLLO_API_KEY === 'your_apollo_api_key_here') {
        console.error("ERROR: Apollo API key is missing in .env file.");
        return null;
    }

    console.log(`\n🔍 Searching Apollo.io for Organizer: "${organizerName}"...`);
    
    try {
        const response = await axios.post('https://api.apollo.io/api/v1/mixed_people/search', {
            // We search across people and organizations using the organizer name
            q_organization_name: organizerName,
            q_person_name: organizerName,
            page: 1
        }, {
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'X-Api-Key': APOLLO_API_KEY
            }
        });

        const results = response.data.contacts || response.data.people || [];
        
        if (results.length > 0) {
            console.log(`✅ Found ${results.length} matches in Apollo!`);
            // Map the important fields (Name, Email, LinkedIn, etc.)
            const contacts = results.map((c: any) => ({
                name: c.name,
                email: c.email || c.work_email || "No email available (requires credit unlock)",
                title: c.title,
                linkedin: c.linkedin_url,
                organization: c.organization?.name
            }));
            
            console.log(JSON.stringify(contacts, null, 2));
            return contacts;
        } else {
            console.log("❌ No contacts found for this organizer in Apollo.");
            return [];
        }

    } catch (error: any) {
        console.error("Apollo API Error:", error.response?.data || error.message);
        return null;
    }
}

// Test block if running directly
if (require.main === module) {
    // Testing with the organizer from the Game Makers Mela event
    searchApolloForOrganizer("Unboxed Board Games Club Ahmedabad").then(res => {
        console.log("Test complete.");
    });
}
