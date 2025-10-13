from flask import Flask, render_template, request, jsonify
from openai import OpenAI
import os

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process_audio", methods=["POST"])
def process_audio():
    data = request.get_json(force=True)
    user_text = data.get("text", "").strip()

    if not user_text:
        return jsonify({"reply": "لم أسمعك جيدًا، حاول مرة أخرى."})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "أنت المساعد الصوتي إيلاف، صوتك لطيف وهادئ وترد بطريقة أنيقة ومهذبة."},
                {"role": "user", "content": user_text}
            ]
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"reply": f"حدث خطأ في المعالجة: {e}"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
