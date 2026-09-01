"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const emailFinder_1 = require("./src/emailFinder");
async function test() {
    const res = await (0, emailFinder_1.findEmailViaGoogleSearch)('aProCh - Riverside Education Foundation', 'Ahmedabad');
    console.log(JSON.stringify(res, null, 2));
}
test().catch(console.error);
