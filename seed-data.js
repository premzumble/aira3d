/**
 * Aira3D - Firestore Seed Data Script
 * 
 * Run this script to populate your Firestore with sample products:
 *   1. Replace firebaseConfig with your actual Firebase credentials
 *   2. Run: node seed-data.js
 *   3. Products will be added to the 'products' collection
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "firebase/firestore";

// ============================================
// REPLACE WITH YOUR FIREBASE CONFIG
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyACwOhmhuKCgAYvY_M8c1dkaTZeAA4w2Uk",
  authDomain: "aira3d.firebaseapp.com",
  projectId: "aira3d",
  storageBucket: "aira3d.firebasestorage.app",
  messagingSenderId: "454155670700",
  appId: "1:454155670700:web:3c38b93c8468ac04323b09"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// SAMPLE PRODUCTS DATA
// ============================================
const sampleProducts = [
  {
    name: "Lord Ganesh Statue - Classic",
    category: "Ganesh Models",
    price: 2499,
    description: "Beautiful handcrafted 3D printed Lord Ganesh statue. Perfect for home temple, office desk, or gifting. Made with high-quality PLA material with smooth finish.",
    imageUrl: "",
    material: "PLA",
    size: "15cm x 12cm x 18cm",
    featured: true
  },
  {
    name: "Ganesh Idol - Modern Design",
    category: "Ganesh Models",
    price: 3499,
    description: "Modern artistic Ganesh idol with intricate details. A blend of traditional and contemporary design. Ideal for festive decorations.",
    imageUrl: "",
    material: "Resin",
    size: "20cm x 15cm x 25cm",
    featured: true
  },
  {
    name: "Decorative Name Plate - Custom",
    category: "Name Plates",
    price: 599,
    description: "Personalized 3D printed name plate for your home or office. Available in multiple fonts and colors. Weather-resistant material.",
    imageUrl: "",
    material: "PLA",
    size: "30cm x 8cm",
    featured: true
  },
  {
    name: "Photo Frame - Heart Shape",
    category: "Photo Frames",
    price: 899,
    description: "Elegant heart-shaped photo frame with 3D printed design. Fits 4x6 inch photos. A perfect gift for loved ones.",
    imageUrl: "",
    material: "PLA",
    size: "12cm x 12cm",
    featured: false
  },
  {
    name: "Kitchen Spice Organizer",
    category: "Kitchen Products",
    price: 1299,
    description: "Multi-compartment 3D printed spice organizer. Keep your kitchen organized with this stylish design. Easy to clean and durable.",
    imageUrl: "",
    material: "PETG",
    size: "25cm x 15cm x 10cm",
    featured: true
  },
  {
    name: "Buddha Statue - Meditating",
    category: "Statues",
    price: 1899,
    description: "Serene meditating Buddha statue with peaceful expression. Creates a calm atmosphere in any space. Perfect for meditation rooms.",
    imageUrl: "",
    material: "PLA",
    size: "12cm x 10cm x 18cm",
    featured: false
  },
  {
    name: "Desk Pen Holder - Geometric",
    category: "Office Decor",
    price: 499,
    description: "Modern geometric pen holder for your desk. Multiple slots for pens, markers, and stationery. Sleek and functional design.",
    imageUrl: "",
    material: "PLA",
    size: "10cm x 10cm x 15cm",
    featured: false
  },
  {
    name: "Custom Cake Topper",
    category: "Gifts",
    price: 399,
    description: "Personalized cake topper for birthdays, anniversaries, and celebrations. Upload your design or text. Made with food-safe material options.",
    imageUrl: "",
    material: "PLA",
    size: "Customizable",
    featured: true
  },
  {
    name: "Wall Hanging Flower Vase",
    category: "Home Decor",
    price: 699,
    description: "Unique wall-mounted flower vase with modern geometric pattern. Perfect for dried flowers or small plants. Adds elegance to any wall.",
    imageUrl: "",
    material: "PLA",
    size: "15cm x 10cm",
    featured: false
  },
  {
    name: "Custom Name Keychain",
    category: "Gifts",
    price: 199,
    description: "Personalized keychain with custom name or text. Durable and lightweight. Great gift for friends and family.",
    imageUrl: "",
    material: "PLA",
    size: "5cm x 3cm",
    featured: false
  },
  {
    name: "Mobile Phone Stand - Adjustable",
    category: "Office Decor",
    price: 349,
    description: "Adjustable 3D printed mobile phone stand. Compatible with all phone sizes. Perfect for video calls and watching videos.",
    imageUrl: "",
    material: "PLA",
    size: "8cm x 6cm x 12cm",
    featured: false
  },
  {
    name: "Ganesh Lamp / Diya",
    category: "Ganesh Models",
    price: 1599,
    description: "3D printed Ganesh-shaped lamp holder. Can be used with LED candles or diyas. Beautiful for Diwali and festive decorations.",
    imageUrl: "",
    material: "PLA",
    size: "10cm x 8cm x 15cm",
    featured: true
  }
];

// ============================================
// SEED DATA FUNCTION
// ============================================
async function seedProducts() {
  console.log("🌱 Starting to seed Aira3D Firestore with sample products...\n");

  // Check if products already exist
  const q = query(collection(db, "products"));
  const snapshot = await getDocs(q);

  if (snapshot.size > 0) {
    console.log(`⚠️  Found ${snapshot.size} existing products in Firestore.`);
    console.log("   Skipping seed to avoid duplicates.\n");
    console.log("   To re-seed, delete existing products manually in Firebase Console.");
    return;
  }

  console.log(`📦 Adding ${sampleProducts.length} sample products...\n`);

  for (let i = 0; i < sampleProducts.length; i++) {
    const product = sampleProducts[i];
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...product,
        createdAt: serverTimestamp()
      });
      console.log(`  ✅ [${i + 1}/${sampleProducts.length}] Added: "${product.name}" (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`  ❌ Failed to add "${product.name}":`, error.message);
    }
  }

  console.log("\n🎉 Seed complete! All sample products added to Firestore.");
  console.log("   Go to your Firebase Console → Firestore → products collection to verify.\n");
}

// ============================================
// RUN SEED
// ============================================
seedProducts()
  .then(() => {
    console.log("Done! Press Ctrl+C to exit.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
