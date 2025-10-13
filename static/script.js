const statusEl = document.getElementById("status");
const responseBox = document.getElementById("response-box");
const toggleBtn = document.getElementById("toggle-speech");

let isListening = false;
let isSpeechEnabled = true;
let recognition;

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.lang = "ar-SA";  // تحسين الصوت العربي
  recognition.continuous = true; // الاستماع تلقائيًا بدون توقف
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    statusEl.textContent = "🎧 جاري الاستماع...";
    document.querySelector(".mouth").style.animation = "speak 0.5s infinite";
  };

  recognition.onend = () => {
    isListening = false;
    statusEl.textContent = "🤖 جارٍ التفكير...";
    document.querySelector(".mouth").style.animation = "";
    // إعادة تشغيل الاستماع تلقائيًا
    recognition.start();
  };

  recognition.onresult = async (event) => {
    const text = event.results[event.results.length - 1][0].transcript;
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

    if (isSpeechEnabled) speak(data.reply);
  };

  // بدء الاستماع تلقائيًا عند فتح الصفحة
  recognition.start();
}

// وظيفة تشغيل وإيقاف الصوت
toggleBtn.onclick = () => {
  isSpeechEnabled = !isSpeechEnabled;
  toggleBtn.textContent = isSpeechEnabled ? "🔊 تشغيل/إيقاف الصوت" : "🔇 الصوت متوقف";
};

// دالة نطق النص
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA"; // صوت عربي واضح
  utterance.rate = 1;       // سرعة الكلام
  speechSynthesis.speak(utterance);
}
