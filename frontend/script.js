const chatContainer = document.getElementById("chatContainer");
const chatList = document.getElementById("chatList");
const userInput = document.getElementById("userInput");
const chatForm = document.getElementById("chatForm");
const newChatBtn = document.getElementById("newChatBtn");
const deleteChatBtn = document.getElementById("deleteChatBtn");
const toggleVoiceBotBtn = document.getElementById("toggleVoiceBotBtn");
const toggleVoiceUserBtn = document.getElementById("toggleVoiceUserBtn");

const API_URL = "/api/chat";
let chats = JSON.parse(localStorage.getItem("gemini_chats")) || [];
let currentChatIndex = chats.length > 0 ? 0 : -1;
let botVoiceEnabled = false;
let userVoiceEnabled = false;
let recognition;

// Inisialisasi Speech Recognition
if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage(transcript);
    };
    recognition.onend = () => {
        if(userVoiceEnabled) recognition.start();
    };
}

function renderChat() {
    chatContainer.innerHTML = "";
    if (currentChatIndex < 0) return;
    
    chats[currentChatIndex].messages.forEach((msg) => {
        const wrapper = document.createElement("div");
        wrapper.className = `d-flex flex-column ${msg.sender === "user" ? "align-items-end" : "align-items-start"}`;
        
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${msg.sender}`;
        bubble.textContent = msg.text;
        
        const time = document.createElement("div");
        time.className = "timestamp";
        time.textContent = new Date(msg.time).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
        
        wrapper.appendChild(bubble);
        wrapper.appendChild(time);
        chatContainer.appendChild(wrapper);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderChatList() {
    chatList.innerHTML = "";
    chats.forEach((chat, i) => {
        const li = document.createElement("li");
        li.textContent = chat.title || `Diskusi ${i + 1}`;
        li.className = `p-3 pointer ${i === currentChatIndex ? "active-chat" : ""}`;
        li.style.cursor = "pointer";
        li.onclick = () => {
            currentChatIndex = i;
            renderChatList();
            renderChat();
            
            const sidebarEl = document.getElementById('sidebarMenu');
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(sidebarEl);
            if(bsOffcanvas) bsOffcanvas.hide();
        };
        chatList.appendChild(li);
    });
}

function saveChats() {
    localStorage.setItem("gemini_chats", JSON.stringify(chats));
    renderChatList();
}

function useTemplate(text) {
    userInput.value = text;
    sendMessage(text);
    userInput.value = "";
}

async function sendMessage(message) {
    if (currentChatIndex < 0) return;

    chats[currentChatIndex].messages.push({
        sender: "user",
        text: message,
        time: Date.now(),
    });
    renderChat();
    saveChats();

    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes("siapa kamu") || lowerMsg.includes("kamu siapa") || lowerMsg.includes("nama kamu")) {
        const reply = "Saya adalah IF-Bara, asisten AI untuk Program Studi Informatika Universitas Baturaja. Ada yang bisa saya bantu? 🎓";
        addBotReply(reply);
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        const data = await res.json();
        addBotReply(data.reply || "⚠️ Maaf, IF-Bara sedang mengalami kendala teknis.");
    } catch (err) {
        addBotReply("⚠️ Gagal terhubung ke server Informatika UNBARA.");
    }
}

function addBotReply(text) {
    chats[currentChatIndex].messages.push({
        sender: "bot",
        text: text,
        time: Date.now(),
    });
    renderChat();
    saveChats();
    if (botVoiceEnabled) speak(text);
}

function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "id-ID";
    speechSynthesis.speak(utter);
}

// Event Listeners
chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = userInput.value.trim();
    if (msg === "") return;
    userInput.value = "";
    sendMessage(msg);
});

newChatBtn.addEventListener("click", () => {
    const newChat = { title: `Diskusi ${chats.length + 1}`, messages: [] };
    chats.push(newChat);
    currentChatIndex = chats.length - 1;
    saveChats();
    renderChat();
});

deleteChatBtn.addEventListener("click", () => {
    if (confirm("Hapus seluruh riwayat diskusi?")) {
        chats = [];
        currentChatIndex = -1;
        saveChats();
        chatContainer.innerHTML = "";
    }
});

toggleVoiceBotBtn.addEventListener("click", () => {
    botVoiceEnabled = !botVoiceEnabled;
    toggleVoiceBotBtn.classList.toggle("btn-primary", botVoiceEnabled);
    toggleVoiceBotBtn.textContent = botVoiceEnabled ? "🔊 Audio: ON" : "🔇 Audio: OFF";
});

toggleVoiceUserBtn.addEventListener("click", () => {
    userVoiceEnabled = !userVoiceEnabled;
    toggleVoiceUserBtn.classList.toggle("active", userVoiceEnabled);
    if (userVoiceEnabled && recognition) recognition.start();
    else if (recognition) recognition.stop();
});

// Bootstrapping
if (chats.length === 0) {
    chats.push({ title: "Diskusi Baru", messages: [] });
    currentChatIndex = 0;
}
renderChatList();
renderChat();