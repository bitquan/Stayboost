#!/usr/bin/env node

/**
 * StayBoost Icon Generator
 * 
 * This script creates different sized icons for the StayBoost app.
 * It generates icons that represent exit-intent popups with discount offers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple text-based icon for terminals/CLI
const createTextIcon = () => {
  return `
   ╭─────────────╮
   │ ╭─────────╮ │  ← Browser Window
   │ │  ↗️ EXIT │ │  
   │ ╰─────────╯ │
   │             │
   │  ┌─────────┐│  ← Exit-Intent Popup
   │  │ 10% OFF ││
   │  │ [CLAIM] ││
   │  └─────────┘│
   ╰─────────────╯
   
   StayBoost - Exit-Intent Popups
  `;
};

// Icon metadata for Shopify app
const iconMetadata = {
  name: "StayBoost",
  description: "Exit-Intent Popup App Icon",
  version: "1.0.0",
  sizes: [16, 32, 64, 128, 256, 512],
  formats: ["svg", "png", "ico"],
  colors: {
    primary: "#4F46E5",
    secondary: "#7C3AED", 
    accent: "#059669",
    background: "#FFFFFF",
    text: "#1E293B"
  },
  concept: "Browser window with exit cursor and popup modal showing discount offer"
};

// Save metadata
const publicDir = path.join(__dirname, '../public');
fs.writeFileSync(
  path.join(publicDir, 'icon-metadata.json'), 
  JSON.stringify(iconMetadata, null, 2)
);

// Save text representation
fs.writeFileSync(
  path.join(publicDir, 'icon-ascii.txt'), 
  createTextIcon()
);

console.log('✅ StayBoost icons and metadata generated successfully!');
console.log('📁 Files created in /public/');
console.log('   - app-icon.svg (main app icon)');
console.log('   - logo-256.svg (app logo)'); 
console.log('   - favicon.svg (browser favicon)');
console.log('   - icon-metadata.json (icon specifications)');
console.log('   - icon-ascii.txt (text representation)');
console.log('');
console.log('🎨 Icon represents:');
console.log('   - Browser window with exit cursor');
console.log('   - Exit-intent popup with discount offer');
console.log('   - StayBoost branding colors');
console.log('');
console.log('📋 Next steps:');
console.log('   1. Upload logo-256.svg to Shopify Partner Dashboard');
console.log('   2. Use in app store listings and marketing materials');
console.log('   3. favicon.svg will be used in browser tabs automatically');
