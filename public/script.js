// 🌍 Global State
let messageCount = 0;
let fatigueCount = 0;
let lastSummaryShownAt = 0;
let inactivityTimer;

let currentLanguage = "en";
let chats = [];
let currentChat = [];

const messages = document.getElementById("messages");

// 📊 Chart
let stressChart;


// 💬 Add message to UI
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.innerText = text;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}


// 💾 Save message
function saveToChat(text, sender, stress = 0) {
  currentChat.push({ text, sender, stress });
}


// 🌐 Translate Text
async function translateText(text) {
  if (currentLanguage === "en") return text;

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${currentLanguage}`
    );
    const data = await res.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
}

// 🔊 Speak text
function speakText(text) {
  const synth = window.speechSynthesis;

  if (!synth) {
    console.log("Speech not supported");
    return;
  }

  synth.cancel(); // ✅ stop previous audio

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = currentLanguage === "hi" ? "hi-IN" :
                   currentLanguage === "kn" ? "kn-IN" :
                   currentLanguage === "ta" ? "ta-IN" :
                   "en-US";

  synth.speak(utterance);
}


// 🌿 Smart Inactivity Nudge
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    const nudges = [
      "Just checking in—hope you're doing okay ",
      "Hope you're getting a moment to breathe 🌿",
      "You've been doing a lot—don't forget to pause "
    ];

    const random = nudges[Math.floor(Math.random() * nudges.length)];

    addMessage(random, "bot");
  }, 60000); // 60 sec
}


// 📤 Send Message
async function sendMessage(voiceEmotion = "neutral") {
  const input = document.getElementById("input");
  const text = input.value.trim();

  if (text === "") return;

  input.value = "";

  try {
    const res = await fetch("http://localhost:3000/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
  message: text,
  voiceEmotion: voiceEmotion
})

    });

    const data = await res.json();

    const reply = data.reply;
    const stress = data.stress || 0;

    // ✅ User message
    addMessage(text, "user");
    saveToChat(text, "user", stress);

    // 🧠 Pattern tracking
    messageCount++;

    const lower = text.toLowerCase();
    if (
      lower.includes("tired") ||
      lower.includes("exhausted") ||
      lower.includes("busy") ||
      lower.includes("pressure") ||
      lower.includes("overwhelmed")
    ) {
      fatigueCount++;
    }

    const translatedReply = await translateText(reply);

    setTimeout(() => {
      const mode = document.getElementById("outputMode").value;

// TEXT
if (mode === "text" || mode === "both") {
  addMessage(translatedReply, "bot");
}

// AUDIO
if (mode === "audio" || mode === "both") {
  speakText(translatedReply);
}

saveToChat(translatedReply, "bot", stress);


      // 🌿 Gentle periodic nudge
      if (messageCount % 3 === 0) {
        setTimeout(() => {
          const mode = document.getElementById("outputMode").value;

if (mode === "text" || mode === "both") {
  addMessage("You've been handling quite a bit. Maybe take a small pause", "bot");
}

if (mode === "audio" || mode === "both") {
  speakText("You've been handling quite a bit. Maybe take a small pause");
}

        }, 800);
      }

      // 🌿 Pattern-based nudge
      if (fatigueCount >= 2) {
        setTimeout(() => {
          addMessage(
            "Sounds like it's been a busy stretch. A short break might help 🌿",
            "bot"
          );
          fatigueCount = 0;
        }, 1000);
      }

      // ⭐ DAILY SUMMARY (WINNING FEATURE)
      if (messageCount - lastSummaryShownAt >= 5) {
        setTimeout(() => {
          let summary =
            "You've been quite active today. Hope you're finding small moments to rest ";

          if (fatigueCount >= 2) {
            summary =
              "Today seems a bit demanding for you. Try to take a short pause when you can 🌿";
          }

          addMessage(summary, "bot");
          lastSummaryShownAt = messageCount;

        }, 1200);
      }

    }, 600);

    // 🌿 reset inactivity timer
    resetInactivityTimer();

  } catch (error) {
    console.error("Error:", error);
    addMessage("Something went wrong. I'm still here", "bot");
  }
}


// 📊 Show Insights
function showInsights() {
  const panel = document.getElementById("insightPanel");

  if (!panel) return;

  if (panel.style.display === "none" || panel.style.display === "") {

    const userMsgs = currentChat.filter(m => m.sender === "user");

    const tiredCount = userMsgs.filter(m =>
      m.text.toLowerCase().includes("tired")
    ).length;

    const busyCount = userMsgs.filter(m =>
      m.text.toLowerCase().includes("busy")
    ).length;

    panel.innerHTML = `
      <div style="font-size:14px;">
        <p><b>🧾 Your Day Overview</b></p>
        <ul>
          <li>Mentions of tiredness: ${tiredCount}</li>
          <li>Busy moments: ${busyCount}</li>
        </ul>
        <p style="margin-top:8px;">
          You're handling a lot—remember to take care of yourself too 
        </p>
      </div>
    `;

    panel.style.display = "block";

  } else {
    panel.style.display = "none";
  }
}


// 🧾 Sidebar Toggle
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("overlay");

  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
}


// ❌ Close sidebar/settings
document.addEventListener("click", function (e) {
  const sidebar = document.querySelector(".sidebar");
  const menu = document.querySelector(".menu-icon");
  const overlay = document.getElementById("overlay");

  const settings = document.getElementById("settingsPanel");
  const settingsBtn = document.querySelector(".settings");

  if (
    sidebar &&
    !sidebar.contains(e.target) &&
    menu &&
    !menu.contains(e.target)
  ) {
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }

  if (
    settings &&
    !settings.contains(e.target) &&
    settingsBtn &&
    !settingsBtn.contains(e.target)
  ) {
    settings.classList.remove("active");
  }
});


// ➕ New Chat
function newChat() {
  if (currentChat.length > 0) {
    chats.push([...currentChat]);
    saveChatsToServer();
  }

  currentChat = [];
  messages.innerHTML = "";

  messageCount = 0;
  fatigueCount = 0;
  lastSummaryShownAt = 0;

  renderChats();
}


// 💾 Save chats
async function saveChatsToServer() {
  try {
    await fetch("http://localhost:3000/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(chats)
    });
  } catch (err) {
    console.error("Save error:", err);
  }
}


// 📥 Load chats
async function loadChatsFromServer() {
  try {
    const res = await fetch("http://localhost:3000/chats");
    chats = await res.json();
    renderChats();
  } catch (err) {
    console.error("Load error:", err);
  }
}


// 📜 Render chat list
function renderChats() {
  const chatList = document.getElementById("chatList");
  if (!chatList) return;

  chatList.innerHTML = "";

  chats.forEach((chat, index) => {
    const item = document.createElement("div");
    item.classList.add("chat-item");

    const title = document.createElement("span");
    title.innerText = chat[0]?.text.slice(0, 25) || "New Chat";
    title.onclick = () => loadChat(index);

    const delBtn = document.createElement("span");
    delBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon>';
    delBtn.style.float = "right";
    delBtn.style.cursor = "pointer";

    delBtn.onclick = (e) => {
      e.stopPropagation();
      deleteChat(index);
    };

    item.appendChild(title);
    item.appendChild(delBtn);

    chatList.appendChild(item);
  });
}


function deleteChat(index) {
  if (!confirm("Delete this chat?")) return;

  chats.splice(index, 1);
  saveChatsToServer();
  renderChats();

  messages.innerHTML = "";
  currentChat = [];
}


// 📂 Load Chat
function loadChat(index) {
  messages.innerHTML = "";
  currentChat = chats[index];

  currentChat.forEach(msg => {
    addMessage(msg.text, msg.sender);
  });
}


// 🔍 Search Chats
function searchChats() {
  const query = document.getElementById("search").value.toLowerCase();
  const chatList = document.getElementById("chatList");

  if (query === "") {
    renderChats();
    return;
  }

  chatList.innerHTML = "";

  chats.forEach((chat, index) => {
    const fullText = chat.map(msg => msg.text.toLowerCase()).join(" ");

    if (fullText.includes(query)) {
      const item = document.createElement("div");
      item.classList.add("chat-item");

      item.innerText = chat[0]?.text.slice(0, 25) || "New Chat";
      item.onclick = () => loadChat(index);

      chatList.appendChild(item);
    }
  });
}


// ⚙️ Settings
function toggleSettings() {
  document.getElementById("settingsPanel").classList.toggle("active");
}


// 🌍 Language
function changeLanguage() {
  const select = document.getElementById("languageSelect");
  currentLanguage = select.value;

  const input = document.getElementById("input");

  input.placeholder =
    currentLanguage === "hi" ? "आप कैसा महसूस कर रहे हैं?" :
    currentLanguage === "kn" ? "ನೀವು ಹೇಗಿದ್ದೀರಿ?" :
    currentLanguage === "ta" ? "நீங்கள் எப்படி உணர்கிறீர்கள்?" :
    "How was your day?";
}


// 🎤 Voice
function startVoice() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) return alert("Voice not supported");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  const input = document.getElementById("input");
  input.placeholder = "🎤 Listening...";

  recognition.start();

  let startTime = Date.now();

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const duration = Date.now() - startTime;

    input.value = transcript;

    // 🧠 Estimate emotion from voice speed
    let voiceEmotion = "neutral";

    if (duration < 1500) {
      voiceEmotion = "fast"; // possibly stressed
    } else if (duration > 4000) {
      voiceEmotion = "slow"; // possibly tired/sad
    }

    sendMessage(voiceEmotion); // 👈 pass emotion
  };

  recognition.onend = () => {
    input.placeholder = "How was your day?";
  };
}



// 🚀 Initialize
loadChatsFromServer();
resetInactivityTimer();
