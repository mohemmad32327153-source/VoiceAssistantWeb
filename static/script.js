const button = document.getElementById("talk-btn");
const statusEl = document.getElementById("status");
const responseBox = document.getElementById("response-box");
const mouth = document.querySelector(".mouth");

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
    mouth.classList.add("talking");
  };

  recognition.onend = () => {
    isListening = false;
    statusEl.textContent = "🤖 جاري التفكير...";
    mouth.classList.remove("talking");
  };

  recognition.onresult = async (event) => {
    const text = event.results[0][0].transcript;
    statusEl.textContent = "💭 جاري المعالجة...";
    mouth.classList.remove("talking");

    const response = await fetch("/process_audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    responseBox.textContent = data.reply;
    responseBox.style.display = "block";
    statusEl.textContent = "✅ إيلاف: " + data.reply;
    speak(data.reply);
  };
}

button.onclick = () => {
  if (!isListening) recognition.start();
  else recognition.stop();
};

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  mouth.classList.add("talking");
  utterance.onend = () => mouth.classList.remove("talking");
  speechSynthesis.speak(utterance);
}
