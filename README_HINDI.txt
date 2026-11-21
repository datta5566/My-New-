DK CODEX STUDIO — ANDROID TERMUX SETUP
======================================

जरूरी:
- यह Android पर चलने वाला local Node.js web app है।
- यह official Codex CLI नहीं है; यह OpenAI Responses API पर आधारित chat coding assistant है।
- OpenAI API अलग billing पर चलता है। ChatGPT subscription में API credits शामिल होना जरूरी नहीं।
- gpt-5.5 तभी चलेगा जब आपके API project को उस model की अनुमति हो। अन्यथा उपलब्ध model चुनें।
- API key किसी को न भेजें और screenshot में न दिखाएँ।

1) F-Droid से Termux इंस्टॉल करें:
   https://f-droid.org/packages/com.termux/

2) Termux खोलें और ये commands एक-एक करके चलाएँ:
   pkg update && pkg upgrade -y
   pkg install nodejs-lts -y

3) ZIP को Android के Downloads में extract करें।
   Termux में project folder तक जाएँ। उदाहरण:
   cd ~/storage/downloads/DK_Codex_Studio_Android
   (यदि आपने किसी दूसरे स्थान पर extract किया है, तो उसी path का उपयोग करें।)

4) Server चलाएँ:
   node server.js

5) Termux खुला रहने दें। Chrome में यह URL खोलें:
   http://127.0.0.1:3000

6) API Key Settings में अपनी नई OpenAI API key डालें और Save / Update दबाएँ।
   फिर Check server दबाएँ। इससे local backend और key सेव होने की स्थिति दिखेगी। OpenAI API key/model की असली जाँच पहला chat message भेजने पर होगी।

7) उपयोग बंद करने के लिए Termux में CTRL + C दबाएँ।

महत्वपूर्ण सुरक्षा:
- Server केवल 127.0.0.1 पर bind है; यह सामान्यतः उसी फोन से accessible है।
- .env फाइल में API key plaintext रूप में रहती है। फोन लॉक रखें और project folder साझा न करें।
- सार्वजनिक Wi-Fi पर इसे LAN के लिए expose न करें।
- API key खो जाए या उजागर हो जाए तो OpenAI Platform पर उसे revoke करके नई key बनाएँ।
- Android Battery settings में Termux के लिए battery restriction हटाने से background में बंद होने की संभावना कम हो सकती है।

Troubleshooting:
- "Failed to fetch": Termux में server.js चालू है या नहीं देखें।
- "Cannot find module": इस प्रोजेक्ट में external npm package नहीं चाहिए; Node.js version 20+ उपयोग करें।
- "model not found" या "does not have access": API account में उपलब्ध model चुनें।
- "Incorrect API key": नई valid OpenAI API key सेव करें।
- "insufficient_quota": OpenAI API billing/credits जाँचें।

इस ZIP में:
- index.html       मोबाइल UI
- server.js        local backend और OpenAI API connection
- package.json     project metadata
- .gitignore       .env को Git से बाहर रखता है
- README_HINDI.txt हिंदी setup guide
