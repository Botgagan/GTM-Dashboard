const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

// The main dashboard section wrapper has overflow-hidden which clips anything escaping it
const oldSection = `<section className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">`;
const newSection = `<section className="bg-white rounded-2xl shadow-sm border overflow-visible flex flex-col">`;

content = content.replace(oldSection, newSection);
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Removed overflow-hidden from outer dashboard section");
