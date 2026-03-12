import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import webpush from "web-push";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Supabase Setup for Server
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ygymcnnlkmocskujhptf.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// VAPID keys
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || "BEzpOxT-TMc2t6UE0zWVZCTbfMxO0ENJGG2Vrx0bf5P_91EmT7zJbQksM2wjq9fhrcAxgjzqjt13VM27Q-MFpf8";
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || "PYa-4J9GAbmqzKsVO9QpwbHwBybpyIWlQoUfrhdfQ_Y";

webpush.setVapidDetails(
  "mailto:mdjahedtech@gmail.com",
  publicVapidKey,
  privateVapidKey
);

// API Routes
app.post("/api/notifications/subscribe", async (req, res) => {
  const subscription = req.body;
  
  try {
    // Store in Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }, { onConflict: 'endpoint' });

    if (error) throw error;
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/notifications/send", async (req, res) => {
  const { title, body, url } = req.body;
  
  try {
    // Fetch all subscriptions from Supabase
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/"
    });

    const promises = (subs || []).map(sub => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      return webpush.sendNotification(subscription, payload).catch(async (error) => {
        console.error("Error sending notification:", error);
        // If subscription is invalid, remove it from Supabase
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }
      });
    });

    await Promise.all(promises);
    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Error in notification broadcast:", err);
    res.status(500).json({ error: err.message });
  }
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
