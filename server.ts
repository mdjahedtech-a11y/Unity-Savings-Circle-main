import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import webpush from "web-push";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// VAPID keys should be in env, but providing defaults for initial setup
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || "BEzpOxT-TMc2t6UE0zWVZCTbfMxO0ENJGG2Vrx0bf5P_91EmT7zJbQksM2wjq9fhrcAxgjzqjt13VM27Q-MFpf8";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "PYa-4J9GAbmqzKsVO9QpwbHwBybpyIWlQoUfrhdfQ_Y";

webpush.setVapidDetails(
  "mailto:mdjahedtech@gmail.com",
  publicVapidKey,
  privateVapidKey
);

// In-memory storage for subscriptions (In production, use a database like Supabase)
// Since I can't easily create a new table in Supabase without user interaction or SQL editor,
// I'll use a simple array for now, but I'll recommend the user to use a DB.
let subscriptions: any[] = [];

// API Routes
app.post("/api/notifications/subscribe", (req, res) => {
  const subscription = req.body;
  
  // Check if already exists
  const exists = subscriptions.find(s => s.endpoint === subscription.endpoint);
  if (!exists) {
    subscriptions.push(subscription);
  }
  
  res.status(201).json({});
});

app.post("/api/notifications/send", (req, res) => {
  const { title, body, url } = req.body;
  
  const payload = JSON.stringify({
    title,
    body,
    url: url || "/"
  });

  const promises = subscriptions.map(subscription => 
    webpush.sendNotification(subscription, payload).catch(error => {
      console.error("Error sending notification:", error);
      // If subscription is invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        subscriptions = subscriptions.filter(s => s.endpoint !== subscription.endpoint);
      }
    })
  );

  Promise.all(promises)
    .then(() => res.status(200).json({ success: true }))
    .catch(err => res.status(500).json({ error: err.message }));
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
