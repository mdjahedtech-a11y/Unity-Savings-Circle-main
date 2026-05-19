import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";

const app = express();
const PORT = 3000;

// Initialize Firebase Admin (Only if service account is provided in secrets)
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin initialized");
} else {
  console.warn("FIREBASE_SERVICE_ACCOUNT not found. Push notification sending via server will be disabled.");
}

async function startServer() {
  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/send-notification", async (req, res) => {
    const { token, title, body } = req.body;
    
    if (!admin.apps.length) {
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }

    try {
      const response = await admin.messaging().send({
        token,
        notification: { title, body },
      });
      res.json({ success: true, messageId: response });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
