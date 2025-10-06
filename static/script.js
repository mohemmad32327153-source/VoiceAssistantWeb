const startBtn = document.getElementById("btnStart");
const responseText = document.getElementById("responseText");
const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");

// إعداد الموجات الصوتية
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 64;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function drawWave() {
      requestAnimationFrame(drawWave);
      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgb(${barHeight + 100},200,255)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    }
    drawWave();

    // ======== وظيفة الضغط على زر "تحدث الآن" ========
    startBtn.onclick = () => {
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        responseText.textContent = "⏳ جاري التحليل والرد...";

        fetch("/voice", { method: "POST", body: formData })
          .then(res => res.json())
          .then(data => {
            responseText.textContent = data.reply;

            // تشغيل الصوت باستخدام SpeechSynthesis بناءً على اللغة المكتشفة
            const utter = new SpeechSynthesisUtterance(data.reply);
            utter.lang = data.lang === "ar" ? "ar-SA" : "en-US";
            speechSynthesis.speak(utter);
          })
          .catch(err => {
            console.error(err);
            responseText.textContent = "❌ حدث خطأ في التواصل مع الخادم.";
          });
      };

      // بدء التسجيل
      mediaRecorder.start();
      responseText.textContent = "🎙️ استمع الآن...";

      // وقف التسجيل بعد 4 ثواني أو يمكنك تعديل الوقت
      setTimeout(() => {
        mediaRecorder.stop();
      }, 4000);
    };
  })
  .catch(err => {
    console.error("Error accessing microphone:", err);
    responseText.textContent = "❌ لم يتمكن المتصفح من الوصول إلى الميكروفون.";
  });
