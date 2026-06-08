const http = require("http");
const data = JSON.stringify({ url: "https://www.webtoons.com/en/fantasy/archmage-curriculum/ep-9-archmage-uihyeok-jeong/viewer?title_no=9884&episode_no=9" });
const options = {
  hostname: "localhost",
  port: 3000,
  path: "/api/scrape-images",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data)
  }
};
const req = http.request(options, res => {
  console.log("STATUS", res.statusCode);
  console.log("HEADERS", JSON.stringify(res.headers));
  let body = "";
  res.on("data", chunk => body += chunk);
  res.on("end", () => {
    console.log("BODY", body);
  });
});
req.on("error", err => console.error("REQ ERROR", err));
req.write(data);
req.end();
