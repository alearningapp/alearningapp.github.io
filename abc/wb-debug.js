function cacheSize(c) {
  return c.keys().then((a) => {
    return Promise.all(
      a.map((req) =>
        c.match(req).then((res) =>
          res
            .clone()
            .blob()
            .then((b) => b.size)
        )
      )
    ).then((a) => a.reduce((acc, n) => acc + n, 0));
  });
}

function endwith(str, end) {
  return str.lastIndexOf(end) == str.length - end.length;
}
function isValid(response, time) {
  if (!response) return false;
  var fetched = response.headers.get("sw-fetched-on");
  if (fetched && parseInt(fetched) >= parseInt(time)) return true;
  return false;
}

function rmExpireItems(c, time) {
  return c.keys().then((a) => {
    //console.error(a);
    return Promise.all(
      a.map((req) =>
        c
          .match(req)
          .then(
            (res) =>
              !isValid(res, time) &&
              (console.log("delete " + req), c.delete(req))
          )
      )
    ).then((a) => a.reduce((acc, n) => acc + n, 0));
  });
}
// returns approximate size of all caches (in bytes)
function cachesSize() {
  return caches.keys().then((a) => {
    return Promise.all(
      a.map((n) => caches.open(n).then((c) => cacheSize(c)))
    ).then((a) => a.reduce((acc, n) => acc + n, 0));
  });
}

let cacheMode = 0;
let type = 0;
let vCacheName = "vcache";
let localCacheName = "local";

let cacheName = "cache";
let lastcleantime = 0;
self.addEventListener("fetch", (event) => {
  let url = event.request.url;
  let method = event.request.method;

  const request2 = event.request.clone();
  let pathname = new URL(url).pathname;

  if (method == "GET" && pathname.indexOf("/list/") > -1) {
    console.log("list");

    let cname =
      pathname.indexOf("/list/cache/local") > -1 ? localCacheName : cacheName;

    let test2 = async (pathname) => {
      let cache = await caches.open(cname);

      let rows = await cache
        .keys()
        .then((r) =>
          r.filter((e) => e.url.indexOf(pathname.split("/list/")[1]) > -1)
        )
        .then((a) =>
          Promise.all(
            a.map((req) =>
              cache.match(req).then((res) => {
                req.headers.set("cat", res.headers.get("cat"));
                return req;
              })
            )
          )
        );

      return new Response(
        JSON.stringify(
          rows.map((r) => {
            return {
              url: r.url,
              cat: r.headers.get("cat"),
              title:
                (r.headers.get("cat") ? r.headers.get("cat") + " " : "") +
                decodeURIComponent(r.url.split("/").pop()),
            };
          })
        ),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    return event.respondWith(test2(pathname));
  } else if (method == "PUT") {
    let name = url;
    let response = new Response(JSON.stringify({ path: name }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    if (request2.headers.get("name"))
      name = name + "/" + request2.headers.get("name");

    let request = new Request(name);
    let cat = request2.headers.get("cat") || "";

    request.headers.set("cat", cat);
    if (request2.headers.get("delete")) {
      caches
        .open(localCacheName)
        .then((c) => c.delete(request2.headers.get("delete")));

      return event.respondWith(response);
    }

    let type = request2.headers.get("type") || "application/json";
    let encode = request2.headers.get("encode") || "";

    // let typemethod = type.indexOf("video") > -1 ? "blob" : "text";
    let typemethod = "text";

    let test3 = async () => {
      let content = await request2[typemethod]();

      let cache = await caches.open(localCacheName);

      await cache.delete(request);
      console.log("delete from cache " + name);

      if (encode == "base64") {
        let headers = {
          "Content-Type": type,
          title: request2.headers.get("name"),
          "sw-fetched-on": new Date().getTime(),
        };
        if (cat) headers.cat = cat;

        let r = await fetch(content);

        let body = await r.blob();
        await cache.put(
          request,
          new Response(body, {
            status: r.status,
            statusText: r.statusText,
            headers: headers,
          })
        );
      } else {
        cache = await caches.open(cacheName);
        await cache.delete(request);

        await cache.put(
          request,
          new Response(content, {
            status: 200,
            headers: {
              "Content-Type": type,
              "Content-Length":
                typemethod == "blob" ? content.size : content.length,
              title: request2.headers.get("name"),
              "sw-fetched-on": new Date().getTime(),
            },
          })
        );
      }

      //console.log("resp");
      return response;
    };

    return event.respondWith(test3());
  }

  if (pathname.indexOf("/cmd/") == 0) {
    let cmd = pathname.split("/");
    switch (cmd[2]) {
      case "offline": {
        cacheMode = parseInt(cmd[3]);

        let response = new Response(JSON.stringify({ cacheMode: cacheMode }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        console.group("offline");
        console.log("offlinemode:", cacheMode);
        console.groupEnd();
        return event.respondWith(response);
      }

      case "type": {
        type = parseInt(cmd[3]);

        let response = new Response(JSON.stringify({ cacheMode: cacheMode }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        console.log("offlinemode:", cacheMode);
        return event.respondWith(response);
      }
      case "cleanExpire":
        let ms = 0;
        try {
          ms = parseInt(cmd[3]);
        } catch (error) {
          console.error(error);
          ms = new Date().getTime() - 5 * 3600 * 1000 * 24;
        }

        if (ms != lastcleantime) {
          lastcleantime = ms;

          let test4 = async () => {
            let c = await caches.open(cacheName);

            await rmExpireItems(c, ms);

            c = await caches.open(vCacheName);
            await rmExpireItems(c, ms);

            return new Response(JSON.stringify({ ok: "done" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          };
          return event.respondWith(test4());
        } else {
          return event.respondWith(
            new Response(
              JSON.stringify({ ok: "error", lastcleantime: lastcleantime }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
        }
    }
  }

  if (cacheMode || url.indexOf(location.host) > -1) {
    console.group("offline", url);
    console.log("offlinemode2:", cacheMode);
    console.groupEnd();

    let test = async (event) => {
      let r = await caches.match(event.request.url);
      console.log(r, event.request.url);
      if (r) return r;
      //if (location.pathname == new URL(url).pathname)
      r = await caches.match(event.request.url, { ignoreSearch: true });

      console.log(r, event.request.url);

      if (r || event.request.url.indexOf("/cache/") > -1) return r;

      if (endwith(event.request.url.split("?")[0], "/")) {
        r = await caches.match(event.request.url.split("?")[0] + "index.html", {
          ignoreSearch: true,
        });
      }

      console.log(r, event.request.url);
      if (r) return r;
      r = await fetch(event.request);

      var copy = r.clone();
      let cache = await caches.open(acacheName);
      cache.put(event.request, copy);
      return r;
    };

    return event.respondWith(test(event));
  }

  let test5 = async (event) => {
    let cache = await caches.open("tts");

    let response = await cache.match(event.request);

    if (response) return response;
    response = await fetch(event.request.url, { mode: "no-cors" });

    var copy = response.clone();
    cache.put(event.request, copy);

    return response;
  };
  endwith(event.request.url, "_tts=1") && event.respondWith(test5(event));

  let test6 = async (event) => {
    let cache = await caches.open(vCacheName);

    let response = await cache.match(event.request);
    if (response) return response;

    response = await fetch(event.request.url);
    var copy = response.clone();
    copy.ok &&
      (copy.status == 200 || copy.status == 0) &&
      response
        .clone()
        .text()
        .then(() => {
          var headers = new Headers(copy.headers);
          headers.append("sw-fetched-on", new Date().getTime());
          return copy.blob().then(function (body) {
            return cache.put(
              event.request,
              new Response(body, {
                status: copy.status,
                statusText: copy.statusText,
                headers: headers,
              })
            );
          });
        });

    return response;
  };

  event.request.url.indexOf(location.host) == -1 &&
    type == 1 &&
    event.request.url.indexOf("callback=") == -1 &&
    !endwith(event.request.url, "_tts=1") &&
    event.respondWith(test6(event));
});
