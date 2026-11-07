import { readFile } from "node:fs/promises";
import { createServer } from "node:https";
import { request } from "node:http";
import { createConnection } from "node:net";

const ca = await readFile(process.env.SANDBOX_PROXY_CA_FILE);
const cert = await readFile(process.env.SANDBOX_PROXY_CERT_FILE);
const key = await readFile(process.env.SANDBOX_PROXY_KEY_FILE);
const dockerSocket = process.env.SANDBOX_PROXY_UPSTREAM_SOCKET;

if (!dockerSocket?.startsWith("/")) {
  throw new Error("SANDBOX_PROXY_UPSTREAM_SOCKET must be an absolute Unix socket path.");
}

const server = createServer({
  ca,
  cert,
  key,
  requestCert: true,
  rejectUnauthorized: true,
  minVersion: "TLSv1.2",
}, (incoming, outgoing) => {
  const path = incoming.url ?? "/";
  if (!path.startsWith("/v1.45/")) {
    outgoing.writeHead(404);
    outgoing.end();
    return;
  }
  const headers = { ...incoming.headers, host: "localhost" };
  delete headers.connection;
  delete headers["proxy-connection"];
  const upstream = request({
    socketPath: dockerSocket,
    path,
    method: incoming.method,
    headers,
  }, (response) => {
    const responseHeaders = { ...response.headers };
    delete responseHeaders.connection;
    delete responseHeaders["transfer-encoding"];
    outgoing.writeHead(response.statusCode ?? 502, responseHeaders);
    response.pipe(outgoing);
  });
  upstream.on("error", () => {
    if (!outgoing.headersSent) outgoing.writeHead(502);
    outgoing.end();
  });
  incoming.on("aborted", () => upstream.destroy());
  outgoing.on("close", () => {
    if (!outgoing.writableEnded) upstream.destroy();
  });
  incoming.pipe(upstream);
});

server.on("upgrade", (incoming, downstream, head) => {
  const path = incoming.url ?? "/";
  if (incoming.method !== "POST" || !/^\/v1\.45\/containers\/[a-f0-9]{12,64}\/attach\?stream=1&stdin=1&stdout=0&stderr=0$/i.test(path)) {
    downstream.end("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
    return;
  }

  const upstream = createConnection(dockerSocket);
  const fail = () => {
    downstream.destroy();
    upstream.destroy();
  };
  upstream.on("connect", () => {
    upstream.write(`${incoming.method} ${path} HTTP/1.1\r\nHost: localhost\r\nConnection: Upgrade\r\nUpgrade: tcp\r\nContent-Length: 0\r\n\r\n`);
    if (head.byteLength) upstream.write(head);
    downstream.pipe(upstream);
    upstream.pipe(downstream);
  });
  upstream.on("error", fail);
  downstream.on("error", fail);
  downstream.on("close", () => upstream.destroy());
  upstream.on("close", () => downstream.destroy());
});

server.listen(2376, "127.0.0.1");
