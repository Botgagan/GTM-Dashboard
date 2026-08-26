require('dotenv').config();
import { findEmailViaGoogleSearch } from './src/emailFinder';

async function test() {
    const res = await findEmailViaGoogleSearch('aProCh - Riverside Education Foundation', 'Ahmedabad');
    console.log(JSON.stringify(res, null, 2));
}

test().catch(console.error);
