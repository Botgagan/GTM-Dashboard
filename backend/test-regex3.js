const regex = /"startDate"\s*:\s*"([^"]+)"/i;
const testStr = `{"jsonLd":{"startDate":"2026-09-07T12:30:00.000Z"}}`;
const match = testStr.match(regex);
console.log(match);
