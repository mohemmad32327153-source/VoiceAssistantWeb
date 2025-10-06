const button = document.getElementById("talk-btn");
const statusEl = document.getElementById("status");
const responseBox = document.getElementById("response-box");

let isListening = false;
let recognition;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    statusEl.textContent = "🎧 جاري الاستماع...";
    document.querySelector(".mouth").style.animation = "speak 0.5s infinite";
  };

  recognition.onend = () => {
    isListening = false;
    statusEl.textContent = "🤖 جاري التفكير...";
    document.querySelector(".mouth").style.animation = "";
  };

  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    statusEl.textContent = "💭 جاري المعالجة...";
    const response = await fetch("/process_audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    responseBox.textContent = data.reply;
    responseBox.style.display = "block";
    statusEl.textContent = "✅ الرد جاهز!";
    speak(data.reply);
  };
}

button.onclick = () => {
  if (!isListening) {
    recognition.start();
  } else {
    recognition.stop();
  }
};

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  speechSynthesis.speak(utterance);
}
