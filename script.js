/* =====================================================
   NEUROCARE AI - Disease Awareness Chatbot
   Vanilla JS | Offline-capable | SIH Demo Safe
   ===================================================== */

(function () {
  "use strict";

  // ---------- Embedded fallback knowledge base ----------
  // Used instantly if data.json is missing/blocked (keeps demo crash-proof)
  var FALLBACK_KB = {
    fever: "Fever Awareness: Rest, stay hydrated, and monitor your temperature regularly. Use light clothing and a ventilated room. If fever crosses 102°F or lasts more than 3 days, consult a doctor immediately.",
    cold: "Common Cold Awareness: Keep warm, drink warm fluids, and try steam inhalation. Rest well. Watch for worsening cough, breathlessness, or high fever.",
    cough: "Cough Awareness: Warm fluids, honey (for adults), and steam inhalation can help. Avoid cold drinks and smoke exposure. Persistent cough beyond 2 weeks needs medical evaluation.",
    headache: "Headache Awareness: Rest in a quiet, dark room, stay hydrated, and avoid screen strain. Sudden severe headache, vision changes, or vomiting needs urgent medical attention.",
    diabetes: "Diabetes Awareness: Maintain a balanced low-sugar diet, exercise regularly, and monitor blood sugar levels. Routine checkups and medication adherence are essential. Consult a doctor for personalized care.",
    bp: "Blood Pressure Awareness: Reduce salt intake, manage stress, exercise regularly, and monitor BP periodically. Persistent high or low readings should be reviewed by a doctor.",
    covid: "COVID-19 Awareness: Watch for fever, cough, breathlessness, or loss of smell/taste. Isolate, stay hydrated, and monitor oxygen levels. Seek immediate care if breathing difficulty occurs."
  };

  var FALLBACK_MESSAGE =
    "Sorry, no medical information found for this query. Please consult a doctor.";

  var KEYWORDS = ["fever", "cold", "cough", "headache", "diabetes", "bp", "covid"];

  var knowledgeBase = null; // populated after data.json load (or fallback)

  // ---------- DOM references (supports both ID conventions) ----------
  function $id(id) {
    return document.getElementById(id);
  }

  var inputEl = $id("userInput") || $id("chatInput");
  var sendBtn = $id("sendBtn") || $id("analyzeBtn") || $id("sendButton");
  var chatBox = $id("chatbox") || $id("chatBody") || $id("chatBox");
  var emptyState = $id("chatEmptyState");

  // ---------- Load knowledge base from data.json (offline-safe) ----------
  function loadKnowledgeBase() {
    fetch("data.json")
      .then(function (res) {
        if (!res.ok) throw new Error("data.json not found");
        return res.json();
      })
      .then(function (data) {
        knowledgeBase = normalizeKB(data);
      })
      .catch(function () {
        // Silent fallback - demo must never crash
        knowledgeBase = FALLBACK_KB;
      });
  }

  // Accepts either { fever: "...", cold: "..." }
  // or [{ keyword: "fever", response: "..." }, ...]
  function normalizeKB(data) {
    if (!data) return FALLBACK_KB;

    if (Array.isArray(data)) {
      var map = {};
      data.forEach(function (item) {
        if (item && item.keyword && item.response) {
          map[String(item.keyword).toLowerCase()] = item.response;
        }
      });
      return Object.keys(map).length ? map : FALLBACK_KB;
    }

    if (typeof data === "object") {
      var lowered = {};
      Object.keys(data).forEach(function (key) {
        lowered[key.toLowerCase()] = data[key];
      });
      return Object.keys(lowered).length ? lowered : FALLBACK_KB;
    }

    return FALLBACK_KB;
  }

  // ---------- Matching logic ----------
  function findResponse(userText) {
    var text = userText.toLowerCase();
    var kb = knowledgeBase || FALLBACK_KB;

    for (var i = 0; i < KEYWORDS.length; i++) {
      var keyword = KEYWORDS[i];
      if (text.indexOf(keyword) !== -1 && kb[keyword]) {
        return kb[keyword];
      }
    }

    // also check any extra keywords present in the loaded KB beyond the core list
    var kbKeys = Object.keys(kb);
    for (var j = 0; j < kbKeys.length; j++) {
      var k = kbKeys[j];
      if (text.indexOf(k) !== -1) {
        return kb[k];
      }
    }

    return FALLBACK_MESSAGE;
  }

  // ---------- UI: append message ----------
  function addMessage(text, sender) {
    if (!chatBox) return;

    if (emptyState && emptyState.parentNode) {
      emptyState.remove();
    }

    var row = document.createElement("div");
    var bubble;

    if (chatBox.id === "chatBody") {
      // Matches NEUROCARE AI markup structure (.msg-row / .msg-avatar / .msg-bubble)
      row.className = "msg-row " + (sender === "user" ? "patient" : "ai");

      var avatar = document.createElement("div");
      avatar.className = "msg-avatar";
      avatar.textContent = sender === "user" ? "P" : "AI";

      bubble = document.createElement("div");
      bubble.className = "msg-bubble";
      bubble.textContent = text;

      row.appendChild(avatar);
      row.appendChild(bubble);
    } else {
      // Generic fallback markup for a plain #chatbox container
      row.className = "chat-message " + sender;
      bubble = document.createElement("span");
      bubble.className = "bubble " + sender;
      bubble.textContent = (sender === "user" ? "You: " : "Bot: ") + text;
      row.appendChild(bubble);
    }

    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // ---------- Typing indicator (small delay before bot reply) ----------
  function showTypingIndicator() {
    if (!chatBox) return null;

    var row = document.createElement("div");
    if (chatBox.id === "chatBody") {
      row.className = "msg-row ai";
      row.innerHTML =
        '<div class="msg-avatar">AI</div><div class="msg-bubble">Typing…</div>';
    } else {
      row.className = "chat-message bot typing";
      row.textContent = "Bot: Typing…";
    }

    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
    return row;
  }

  // ---------- Core send handler ----------
  function handleSend() {
    if (!inputEl) return;

    var rawText = inputEl.value;
    if (!rawText || !rawText.trim()) {
      inputEl.focus();
      return; // prevent empty submission
    }

    var userText = rawText.trim();

    // Show user message
    addMessage(userText, "user");

    // Clear input box
    inputEl.value = "";
    if (typeof inputEl.style !== "undefined") {
      inputEl.style.height = "auto";
    }

    // Typing effect before bot reply
    var typingRow = showTypingIndicator();

    setTimeout(function () {
      var response;
      try {
        response = findResponse(userText.toLowerCase());
      } catch (err) {
        response = FALLBACK_MESSAGE;
      }

      if (typingRow && typingRow.parentNode) {
        typingRow.remove();
      }
      addMessage(response, "bot");
    }, 500 + Math.random() * 400); // 0.5s - 0.9s natural delay
  }

  // ---------- Event bindings ----------
  function initEvents() {
    if (sendBtn) {
      sendBtn.addEventListener("click", function (e) {
        e.preventDefault();
        handleSend();
      });
    }

    if (inputEl) {
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      });
    }
  }

  // ---------- Init ----------
  function init() {
    loadKnowledgeBase();
    initEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
