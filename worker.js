export default {
  async fetch(request, env, ctx) {
    const VALID_UUID = env.UUID || "da3812c9-9ce8-4738-8bbd-b20530a541fa";

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Not a WebSocket request", { status: 400 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    server.addEventListener("message", (event) => {
      try {
        const data = event.data;

        // UUID را از دیتای دریافتی استخراج می‌کنیم (بایت‌های 1 تا 16)
        if (typeof data === "object") {
          const buffer = new Uint8Array(data);
          if (buffer.length >= 17) {
            const uuidBytes = buffer.slice(1, 17);
            const uuid = [...uuidBytes].map((b, i) => {
              const hex = b.toString(16).padStart(2, "0");
              return hex;
            });

            const uuidStr = [
              uuid.slice(0, 4).join("") + uuid.slice(4, 6).join(""),
              uuid.slice(6, 8).join(""),
              uuid.slice(8, 10).join(""),
              uuid.slice(10, 12).join(""),
              uuid.slice(12, 16).join(""),
            ].join("-");

            if (uuidStr.toLowerCase() !== VALID_UUID.toLowerCase()) {
              server.send("Invalid UUID");
              server.close();
              return;
            }
          }
        }

        // اگر UUID معتبر بود، Echo برمی‌گردونیم
        server.send(event.data);
      } catch (e) {
        server.send("Error processing data");
        server.close();
      }
    });

    server.addEventListener("close", () => {
      console.log("WebSocket closed");
    });

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }
};
