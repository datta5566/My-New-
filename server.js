const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ENV_FILE = path.join(ROOT, ".env");
const PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  const content = fs.readFileSync(ENV_FILE, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnvFile();

function saveApiKey(key) {
  const safe = String(key || "").trim();
  if (safe && !safe.startsWith("sk-")) {
    throw new Error("यह OpenAI API Key जैसी नहीं दिख रही। सही API key जाँचें।");
  }
  const model = process.env.OPENAI_MODEL || "gpt-5.5";
  fs.writeFileSync(ENV_FILE, `OPENAI_API_KEY=${safe}\nOPENAI_MODEL=${model}\n`, { mode: 0o600 });
  process.env.OPENAI_API_KEY = safe;
}

function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Request बहुत बड़ा है"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, keyConfigured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || "gpt-5.5" });
  }

  if (req.method === "POST" && url.pathname === "/api/settings/key") {
    try {
      const body = await readBody(req);
      saveApiKey(body.apiKey || "");
      return send(res, 200, { ok: true, message: body.apiKey ? "API Key इस मोबाइल के local backend में सेव हो गई।" : "API Key हटा दी गई।" });
    } catch (e) {
      return send(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/chat") {
    try {
      const body = await readBody(req);
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return send(res, 400, { error: "पहले API Key Settings में सेव करें।" });

      const model = String(body.model || process.env.OPENAI_MODEL || "gpt-5.5").trim();
      const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
      const input = messages.map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 12000)
      }));

      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, input })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = result?.error?.message || `OpenAI API Error (${response.status})`;
        return send(res, response.status, { error: msg, type: result?.error?.type || "api_error" });
      }

      let output = result.output_text || "";
      if (!output && Array.isArray(result.output)) {
        output = result.output.flatMap(item => item.content || [])
          .filter(c => c.type === "output_text")
          .map(c => c.text).join("\n");
      }
      return send(res, 200, { text: output || "कोई टेक्स्ट उत्तर नहीं मिला।", model });
    } catch (e) {
      return send(res, 500, { error: e.message || "Server error" });
    }
  }

  if (req.method === "GET") {
    const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
    const full = path.resolve(ROOT, requested);
    if (!full.startsWith(ROOT + path.sep) && full !== path.join(ROOT, "index.html")) {
      return send(res, 403, { error: "Forbidden" });
    }
    fs.readFile(full, (err, data) => {
      if (err) return send(res, 404, { error: "File not found" });
      const ext = path.extname(full);
      const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript" };
      res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
      res.end(data);
    });
    return;
  }

  send(res, 404, { error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`\nDK Codex Studio चालू है: http://${HOST}:${PORT}`);
  console.log("इसे Android Chrome में खोलें: http://127.0.0.1:3000");
  console.log("Server बंद करने के लिए Termux में CTRL + C दबाएँ।\n");
});
