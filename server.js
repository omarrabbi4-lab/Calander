const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 10000;

const ROOT = __dirname;
const INDEX_FILE = path.join(ROOT, "index.html");


/* =========================================
   MIME TYPES
========================================= */

const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=UTF-8",
  ".webmanifest": "application/manifest+json"
};


/* =========================================
   SEND RESPONSE
========================================= */

function sendResponse(
  res,
  statusCode,
  content,
  contentType = "text/plain; charset=UTF-8"
) {

  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache"
  });

  res.end(content);
}


/* =========================================
   READ REQUEST BODY
========================================= */

function getRequestBody(req) {

  return new Promise((resolve, reject) => {

    let body = "";

    req.on("data", chunk => {

      body += chunk.toString();

      /*
        Prevent extremely large requests.
      */

      if (body.length > 1024 * 1024) {

        reject(
          new Error("Request body too large")
        );

        req.destroy();
      }

    });

    req.on("end", () => {

      resolve(body);

    });

    req.on("error", error => {

      reject(error);

    });

  });

}


/* =========================================
   API RESPONSE
========================================= */

function sendJSON(
  res,
  statusCode,
  data
) {

  sendResponse(
    res,
    statusCode,
    JSON.stringify(data),
    "application/json; charset=UTF-8"
  );

}


/* =========================================
   HEALTH API
========================================= */

function healthAPI(req, res) {

  sendJSON(
    res,
    200,
    {
      success: true,
      app: "বাংলা ক্যালেন্ডার",
      status: "online",
      server: "running",
      time: new Date().toISOString()
    }
  );

}


/* =========================================
   APP INFO API
========================================= */

function appInfoAPI(req, res) {

  sendJSON(
    res,
    200,
    {
      success: true,

      app: {
        name: "বাংলা ক্যালেন্ডার",
        version: "1.0.0",
        language: "বাংলা",
        country: "বাংলাদেশ"
      },

      features: [
        "বাংলা তারিখ",
        "ইংরেজি তারিখ",
        "হিজরি তারিখ",
        "মাসের ক্যালেন্ডার",
        "গুরুত্বপূর্ণ তারিখ"
      ]

    }
  );

}


/* =========================================
   DATE API
========================================= */

function dateAPI(req, res) {

  const now = new Date();

  sendJSON(
    res,
    200,
    {
      success: true,

      date: {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      },

      iso: now.toISOString(),

      timestamp: Date.now()
    }
  );

}


/* =========================================
   API ROUTER
========================================= */

async function handleAPI(
  req,
  res,
  url
) {

  /*
    Health
  */

  if (
    url.pathname === "/health" ||
    url.pathname === "/api/health"
  ) {

    healthAPI(req, res);

    return true;
  }


  /*
    App info
  */

  if (
    url.pathname === "/api/info"
  ) {

    appInfoAPI(req, res);

    return true;
  }


  /*
    Current date
  */

  if (
    url.pathname === "/api/date"
  ) {

    dateAPI(req, res);

    return true;
  }


  /*
    Test API
  */

  if (
    url.pathname === "/api/test"
  ) {

    sendJSON(
      res,
      200,
      {
        success: true,
        message:
          "বাংলা ক্যালেন্ডার API ঠিকভাবে কাজ করছে।"
      }
    );

    return true;
  }


  return false;
}


/* =========================================
   STATIC FILE SERVER
========================================= */

function serveStaticFile(
  req,
  res,
  url
) {

  let requestPath =
    decodeURIComponent(
      url.pathname
    );


  /*
    Home page
  */

  if (
    requestPath === "/" ||
    requestPath === ""
  ) {

    requestPath = "/index.html";

  }


  /*
    Prevent path traversal
  */

  const safePath =
    path.normalize(
      path.join(
        ROOT,
        requestPath
      )
    );


  if (
    !safePath.startsWith(
      ROOT
    )
  ) {

    sendResponse(
      res,
      403,
      "403 Forbidden"
    );

    return;
  }


  fs.stat(
    safePath,
    (error, stats) => {

      if (error) {

        /*
          If a file is not found,
          show index.html for browser routes.
        */

        if (
          requestPath !== "/index.html" &&
          fs.existsSync(INDEX_FILE)
        ) {

          fs.readFile(
            INDEX_FILE,
            (readError, data) => {

              if (readError) {

                sendResponse(
                  res,
                  500,
                  "500 Internal Server Error"
                );

                return;
              }


              sendResponse(
                res,
                200,
                data,
                "text/html; charset=UTF-8"
              );

            }
          );

          return;
        }


        sendResponse(
          res,
          404,
          "404 Not Found"
        );

        return;
      }


      if (
        stats.isDirectory()
      ) {

        const directoryIndex =
          path.join(
            safePath,
            "index.html"
          );


        if (
          fs.existsSync(
            directoryIndex
          )
        ) {

          fs.readFile(
            directoryIndex,
            (readError, data) => {

              if (readError) {

                sendResponse(
                  res,
                  500,
                  "500 Internal Server Error"
                );

                return;
              }


              sendResponse(
                res,
                200,
                data,
                "text/html; charset=UTF-8"
              );

            }
          );

          return;
        }


        sendResponse(
          res,
          403,
          "403 Forbidden"
        );

        return;
      }


      const extension =
        path.extname(
          safePath
        ).toLowerCase();


      const contentType =
        MIME_TYPES[extension] ||
        "application/octet-stream";


      fs.readFile(
        safePath,
        (readError, data) => {

          if (readError) {

            sendResponse(
              res,
              500,
              "500 Internal Server Error"
            );

            return;
          }


          sendResponse(
            res,
            200,
            data,
            contentType
          );

        }
      );

    }
  );

}


/* =========================================
   MAIN SERVER
========================================= */

const server =
  http.createServer(
    async (req, res) => {

      try {

        const url =
          new URL(
            req.url,
            `http://${req.headers.host || "localhost"}`
          );


        /*
          API
        */

        if (
          url.pathname.startsWith(
            "/api/"
          ) ||
          url.pathname === "/health"
        ) {

          const handled =
            await handleAPI(
              req,
              res,
              url
            );


          if (handled) {
            return;
          }


          sendJSON(
            res,
            404,
            {
              success: false,
              error: "API endpoint not found"
            }
          );

          return;
        }


        /*
          Static files
        */

        serveStaticFile(
          req,
          res,
          url
        );

      }

      catch (error) {

        console.error(
          "Server Error:",
          error
        );


        sendJSON(
          res,
          500,
          {
            success: false,
            error:
              "Internal Server Error"
          }
        );

      }

    }
  );


/* =========================================
   SERVER ERROR
========================================= */

server.on(
  "error",
  error => {

    console.error(
      "Server failed:",
      error
    );

  }
);


/* =========================================
   START SERVER
========================================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "================================="
    );

    console.log(
      "বাংলা ক্যালেন্ডার Server Started"
    );

    console.log(
      "Port