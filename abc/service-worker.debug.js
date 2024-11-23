

const acacheName = "v"; // Cahce Stroage 白名单

importScripts(
  "wb-debug.js"
);

self.addEventListener("install", function () {
  console.log("install");

});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});