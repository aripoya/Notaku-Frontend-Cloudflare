export class ChatRoomDO implements DurableObject {
  state: DurableObjectState;
  constructor(state: DurableObjectState, env: any) {
    this.state = state;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const upgradeHeader = req.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") return new Response("Expected Upgrade: websocket", { status: 426 });
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleSession(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response("Not found", { status: 404 });
  }

  async handleSession(ws: WebSocket) {
    ws.accept();
    ws.addEventListener("message", (evt) => {
      const data = typeof evt.data === "string" ? evt.data : "";
      ws.send(`echo: ${data}`);
    });
    ws.addEventListener("close", () => {});
  }
}

export default {
  async fetch(req: Request, env: any) {
    const id = env.CHAT_ROOM.idFromName("global");
    const stub = env.CHAT_ROOM.get(id);
    return stub.fetch(new URL("/ws", new URL(req.url).origin).toString(), req);
  },
} satisfies ExportedHandler;
