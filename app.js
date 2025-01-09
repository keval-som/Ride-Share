import express from "express";
import http from "http";
import { Server } from "socket.io";
import session from "express-session";
import exphbs from "express-handlebars";
import path from "path";
import constructorMethods from "./Routes/index.js";
import cron from "node-cron";
import { chatCleanup } from "./Routes/utils/chatCleanup.js";
import multer from "multer";
import upload from "./middleware/upload.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "AuthCookie",
    secret: "your_session_secret", 
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 600000 }, // 10 minutes
  })
);

// const hbs = exphbs.create({ defaultLayout: "main" });

const hbs = exphbs.create({
  helpers: {
    eq: function (a, b) {
      return a === b;
    },
    json: function (context) {
      return JSON.stringify(context);
    },
    generateStars: function (rating) {
      const stars = [];
      for (let i = 0; i < 5; i++) {
        stars.push(i < rating ? "filled" : "");
      }
      return stars;
    },
    ifEquals: function (arg1, arg2, options) {
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    },
  },
  defaultLayout: "main",
  layoutsDir: path.join(path.resolve(), "views", "layouts"),
  partialsDir: [path.join(path.resolve(), "views", "partials")],
});

cron.schedule("* * * * *", async () => {
  console.log("Running daily chat cleanup...");
  await chatCleanup();
});

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(path.resolve(), "views"));

app.use("/public", express.static(path.join(path.resolve(), "public")));
app.post("/verify", upload.single("licenseImg"), (req, res, next) => {
  next();
});

constructorMethods(app);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
