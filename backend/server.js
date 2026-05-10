const express = require("express");
const fs = require("fs");
const cors = require("cors");
const OpenAI = require("openai");
const path = require("path");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


// ✅ Serve frontend files
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});


const FILE = "chats.json";


// ✅ Ensure chats file exists
if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, "[]");
}


// ✅ Groq/OpenAI client
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});


// 🧠 Invisible Stress Detection
function detectStress(msg) {
  msg = msg.toLowerCase();

  let score = 0;

  if (msg.includes("tired") || msg.includes("exhausted")) score += 30;
  if (msg.includes("stress") || msg.includes("pressure")) score += 40;
  if (msg.includes("overwhelmed")) score += 50;
  if (msg.includes("alone")) score += 30;
  if (msg.includes("no time")) score += 20;
  if (msg.includes("too much")) score += 25;
  if (msg.includes("busy")) score += 20;

  return Math.min(score, 100);
}


// 🟢 GET chats
app.get("/chats", (req, res) => {
  try {
    const data = fs.readFileSync(FILE);
    res.json(JSON.parse(data));
  } catch {
    res.json([]);
  }
});


// 🔵 SAVE chats
app.post("/chats", (req, res) => {
  try {
    fs.writeFileSync(FILE, JSON.stringify(req.body, null, 2));
    res.json({ message: "Saved successfully" });
  } catch (err) {
    res.json({ message: "Error saving chats" });
  }
});


// 🤖 AI ROUTE
app.post("/ai", async (req, res) => {
  const userMessage = req.body.message;
  const voiceEmotion = req.body.voiceEmotion || "neutral";

  if (!userMessage) {
    return res.json({
      reply: "I'm here if you'd like to share something 💙",
      stress: 0
    });
  }

  // 🧠 text stress
  const stress = detectStress(userMessage);

  // 🎤 voice influence
  let finalStress = stress;

  if (voiceEmotion === "fast") finalStress += 15;
  if (voiceEmotion === "slow") finalStress += 20;

  finalStress = Math.min(finalStress, 100);

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `
You are a calm, emotionally intelligent caregiver support assistant.

Rules:
- DO NOT mention stress or analysis
- Keep replies short (1–2 lines)
- Be warm, simple, supportive
`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.9
    });

    let reply = completion.choices[0].message.content;

    // 🌿 Gentle nudges
    if (finalStress >= 70) {
      reply += "\n\nYou've been carrying quite a bit lately—maybe a short pause could help 🌿";
    } else if (finalStress >= 40) {
      reply += "\n\nHope you're getting small moments to breathe in between 💙";
    }

    res.json({
      reply,
      stress: finalStress
    });

  } catch (error) {
    console.error("ERROR:", error);

    res.json({
      reply: "I'm here with you—feel free to share anything 💙",
      stress: 0
    });
  }
});


// 🚀 Start server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});