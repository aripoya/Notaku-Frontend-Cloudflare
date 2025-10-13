export async function chatHandler(req: Request, env: any) {
  const stream = new ReadableStream({
    start(controller) {
      const text = "Halo! Ini respons streaming dari AI (mock).";
      let i = 0;
      const timer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(timer);
          controller.close();
        } else {
          controller.enqueue(new TextEncoder().encode(text[i++]));
        }
      }, 20);
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream" } });
}
