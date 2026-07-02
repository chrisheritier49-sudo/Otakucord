import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let cloudinaryUrl = process.env.CLOUDINARY_URL;

if (cloudinaryUrl) {
  // Strip any brackets like < > or spaces
  cloudinaryUrl = cloudinaryUrl.replace(/[<>]/g, '').trim();
  
  // Check if it is a placeholder or doesn't start with cloudinary://
  if (!cloudinaryUrl.startsWith('cloudinary://') || 
      cloudinaryUrl.includes('YOUR_CLOUDINARY_URL') || 
      cloudinaryUrl.includes('your_') || 
      cloudinaryUrl.includes('api_key')) {
    console.warn("[Env Init] CLOUDINARY_URL is a placeholder or invalid format. Using working default fallback.");
    cloudinaryUrl = 'cloudinary://372844479858438:aP4EUyCPNLFZJO0xESOORB1WAss@dumvapt4q';
  }
} else {
  console.log("[Env Init] CLOUDINARY_URL not found. Using working default fallback.");
  cloudinaryUrl = 'cloudinary://372844479858438:aP4EUyCPNLFZJO0xESOORB1WAss@dumvapt4q';
}

// Update the process environment variable so that the cloudinary library and other code read it correctly
process.env.CLOUDINARY_URL = cloudinaryUrl;
console.log(`[Env Init] Sanitized CLOUDINARY_URL: ${cloudinaryUrl.substring(0, 25)}...`);
