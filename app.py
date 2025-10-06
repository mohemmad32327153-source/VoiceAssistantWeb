# app.py — نسخة متكاملة تربط التعرف على الصوت مع OpenAI وتعيد النص للمتصفح
from flask import Flask, render_template, request, jsonify
import speech_recognition as sr
import os
from openai import OpenAI

app = Flask(__name__)

# ======== تهيئة OpenAI ========
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_KEY:
    raise ValueError("❌ لم يتم العثور على متغير البيئة OPENAI_API_KEY. ضع مفتاح OpenAI في البيئة.")

client = OpenAI(api_key=OPENAI_KEY)

# ======== دالة لاكتشاف اللغة من نص ========
def detect_language_from_text(text: str) -> str:
    # إذا احتوى النص على حروف عربية نعتبرها عربية، خلاف ذلك إنجليزية
    if any('\u0600' <= ch <= '\u06FF' for ch in text):
        return "ar"
    return "en"

# ======== صفحة الواجهة ========
@app.route("/")
def index():
    return render_template("index.html")

# ======== نقطة استقبال الصوت من المتصفح ========
@app.route("/voice", methods=["POST"])
def voice():
    """
    يتوقع ملف صوتي (audio) من المتصفح (Blob).
    يقوم بتحويله إلى نص محلياً (speech_recognition).
    يرسل النص إلى OpenAI للحصول على رد ذكي.
    يعيد JSON: {reply: "...", lang: "ar"|"en", recognized_text: "..."}
    """
    if "audio" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files["audio"]

    recognizer = sr.Recognizer()
    recognized_text = ""
    lang_detected = "en"

    # نحاول تحويل الملف الصوتي إلى نص: نجرب الإنجليزية ثم العربية
    try:
        with sr.AudioFile(audio_file) as source:
            audio_data = recognizer.record(source)
        try:
            recognized_text = recognizer.recognize_google(audio_data, language="en-US")
            lang_detected = "en"
        except sr.UnknownValueError:
            # إن فشل التعرف بالإنجليزي نحاول بالعربي
            try:
                recognized_text = recognizer.recognize_google(audio_data, language="ar-SA")
                lang_detected = "ar"
            except sr.UnknownValueError:
                return jsonify({"reply": "❌ لم أتمكن من فهم الصوت. حاول مرة أخرى بوضوح.", "lang": "ar", "recognized_text": ""})
    except Exception as e:
        # خطأ في معالجة الملف الصوتي
        return jsonify({"reply": f"❌ خطأ في معالجة الملف الصوتي: {str(e)}", "lang": "ar", "recognized_text": ""}), 500

    # طباعة في الطرفية لتتبع ما تم اكتشافه (يساعد في الديباك)
    print("==== recognized text ====")
    print(recognized_text)
    print("language detected:", lang_detected)
    print("=========================")

    # ======== إرسال إلى OpenAI للحصول على رد ذكي ========
    # نرسل النص ونطلب الرد بنفس لغة المستخدم.
    try:
        prompt = recognized_text
        # يمكنك تعديل system instruction لو أردت أسلوب معين
        # هنا نستخدم استدعاء بسيط للحصول على نص الرد
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt
        )
        # استخدم output_text كما استخدمناه سابقًا في كودك
        reply_text = response.output_text.strip() if hasattr(response, "output_text") else ""
        if not reply_text:
            # كاحتياط إذا لم يرجع output_text استخلاص من البنية الأخرى
            # (قد تختلف ردود مكتبات openai في البنيوية)
            try:
                # في بعض نسخ SDK يكون المحتوى في response.output[0].content[0].text أو مشابه
                reply_text = str(response)
            except:
                reply_text = "عذراً، حصل خطأ في الحصول على رد من OpenAI."
    except Exception as e:
        print("OpenAI error:", e)
        return jsonify({"reply": f"❌ خطأ عند التواصل مع OpenAI: {str(e)}", "lang": lang_detected, "recognized_text": recognized_text}), 500

    # ======== إعادة النتيجة إلى المتصفح ========
    return jsonify({
        "reply": reply_text,
        "lang": lang_detected,
        "recognized_text": recognized_text
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

