const http = require("http");
const fs = require("fs");
const path = require("path");

/* =========================================
   PORT
========================================= */

const PORT = process.env.PORT || 10000;


/* =========================================
   WEBSITE DIRECTORY
========================================= */

const ROOT = __dirname;


/* =========================================
   MIME TYPES
========================================= */

const mimeTypes = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=UTF-8",
  ".webmanifest": "application/manifest+json"
};


/* =========================================
   SEND JSON
========================================= */

function sendJSON(res, statusCode, data) {

  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-cache"
  });

  res.end(
    JSON.stringify(data)
  );
}


/* =========================================
   SEND TEXT
========================================= */

function sendText(res, statusCode, text) {

  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=UTF-8"
  });

  res.end(text);
}


/* =========================================
   API ROUTES
========================================= */

function handleAPI(req, res, url) {

  /* ---------------------------------------
     HEALTH
  --------------------------------------- */

  if (
    url.pathname === "/health" ||
    url.pathname === "/api/health"
  ) {

    sendJSON(res, 200, {
      success: true,
      status: "online",
      app: "বাংলা ক্যালেন্ডার",
      time: new Date().toISOString()
    });

    return true;
  }


  /* ---------------------------------------
     API TEST
  --------------------------------------- */

  if (url.pathname === "/api/test") {

    sendJSON(res, 200, {
      success: true,
      message: "বাংলা ক্যালেন্ডার API ঠিকভাবে কাজ করছে।"
    });

    return true;
  }


  /* ---------------------------------------
     APP INFO
  --------------------------------------- */

  if (url.pathname === "/api/info") {

    sendJSON(res, 200, {

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

    });

    return true;
  }


  /* ---------------------------------------
     CURRENT DATE
  --------------------------------------- */

  if (url.pathname === "/api/date") {

    const now = new Date();

    sendJSON(res, 200, {

      success: true,

      date: {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      },

      iso: now.toISOString(),

      timestamp: Date.now()

    });

    return true;
  }


  /* ---------------------------------------
     UNKNOWN API
  --------------------------------------- */

  sendJSON(res, 404, {

    success: false,

    error: "API endpoint not found",

    path: url.pathname

  });

  return true;
}


/* =========================================
   STATIC FILE SERVER
========================================= */

function serveFile(req, res, url) {

  let requestedPath = url.pathname;


  /* ---------------------------------------
     HOME PAGE
  --------------------------------------- */

  if (
    requestedPath === "/" ||
    requestedPath === ""
  ) {

    requestedPath = "/index.html";

  }


  /* ---------------------------------------
     REMOVE QUERY-SAFE PATH
  --------------------------------------- */

  requestedPath =
    decodeURIComponent(requestedPath);


  /* ---------------------------------------
     SECURITY
  --------------------------------------- */

  if (
    requestedPath.includes("..")
  ) {

    sendText(
      res,
      403,
      "403 Forbidden"
    );

    return;
  }


  /* ---------------------------------------
     FILE PATH
  --------------------------------------- */

  const filePath =
    path.join(
      ROOT,
      requestedPath
    );


  /* ---------------------------------------
     CHECK FILE
  --------------------------------------- */

  fs.stat(
    filePath,
    (error, stats) => {

      if (error) {

        /* -------------------------------
           FILE NOT FOUND
        -------------------------------- */

        if (
          requestedPath !== "/index.html"
        ) {

          const indexPath =
            path.join(
              ROOT,
              "index.html"
            );


          if (
            fs.existsSync(indexPath)
          ) {

            fs.readFile(
              indexPath,
              (indexError, data) => {

                if (indexError) {

                  sendText(
                    res,
                    500,
                    "500 Internal Server Error"
                  );

                  return;
                }


                res.writeHead(
                  200,
                  {
                    "Content-Type":
                      "text/html; charset=UTF-8"
                  }
                );

                res.end(data);

              }
            );

            return;
          }

        }


        sendText(
          res,
          404,
          "404 Not Found"
        );

        return;
      }


      /* ---------------------------------
         DIRECTORY
      --------------------------------- */

      if (stats.isDirectory()) {

        const indexFile =
          path.join(
            filePath,
            "index.html"
          );


        if (
          fs.existsSync(indexFile)
        ) {

          fs.readFile(
            indexFile,
            (indexError, data) => {

              if (indexError) {

                sendText(
                  res,
                  500,
                  "500 Internal Server Error"
                );

                return;
              }


              res.writeHead(
                200,
                {
                  "Content-Type":
                    "text/html; charset=UTF-8"
                }
              );

              res.end(data);

            }
          );

          return;
        }


        sendText(
          res,
          403,
          "403 Forbidden"
        );

        return;
      }


      /* ---------------------------------
         FILE EXTENSION
      --------------------------------- */

      const extension =
        path.extname(
          filePath
        ).toLowerCase();


      const contentType =
        mimeTypes[extension] ||
        "application/octet-stream";


      /* ---------------------------------
         READ FILE
      --------------------------------- */

      fs.readFile(
        filePath,
        (readError, data) => {

          if (readError) {

            console.error(
              "File read error:",
              readError
            );


            sendText(
              res,
              500,
              "500 Internal Server Error"
            );

            return;
          }


          res.writeHead(
            200,
            {
              "Content-Type": contentType,

              "Cache-Control":
                "public, max-age=3600"
            }
          );


          res.end(data);

        }
      );

    }
  );

}


/* =========================================
   CREATE SERVER
========================================= */

const server =
  http.createServer(
    (req, res) => {

      try {

        const url =
          new URL(
            req.url,
            "http://" +
            (
              req.headers.host ||
              "localhost"
            )
          );


        console.log(
          req.method,
          url.pathname
        );


        /* -------------------------------
           API
        -------------------------------- */

        if (
          url.pathname === "/health" ||
          url.pathname.startsWith("/api/")
        ) {

          handleAPI(
            req,
            res,
            url
          );

          return;
        }


        /* -------------------------------
           WEBSITE FILES
        -------------------------------- */

        serveFile(
          req,
          res,
          url
        );

      }

      catch (error) {

        console.error(
          "Server error:",
          error
        );


        sendJSON(
          res,
          500,
          {
            success: false,
            error: "Internal Server Error"
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
  (error) => {

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
      "===================================="
    );

    console.log(
      "বাংলা ক্যালেন্ডার"
    );

    console.log(
      "Server is running"
    );

    console.log(
      "Port: " + PORT
    );

    console.log(
      "===================================="
    );

  }
);


/* =========================================
   GRACEFUL SHUTDOWN
========================================= */

process.on(
  "SIGTERM",
  () => {

    console.log(
      "Stopping server..."
    );


    server.close(
      () => {

        console.log(
          "Server stopped."
        );

        process.exit(0);

      }
    );

  }
);


process.on(
  "SIGINT",
  () => {

    console.log(
      "Stopping server..."
    );


    server.close(
      () => {

        console.log(
          "Server stopped."
        );

        process.exit(0);

      }
    );

  }
);