import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { config } from "dotenv";

config({
  path: "./data/config.env",
});

const app = express(); // instead of writing server, app is the convention
// a one liner to create server

mongoose
  .connect(process.env.mongo_url, {
    dbName: "userDatabase",
  })
  .then(() => console.log("db connected"))
  .catch((e) => console.log("Error Detected: ", e));

const mSchema = new mongoose.Schema({
  uname: String,
  email: String,
  pass: String,
  pass1: String,
});
const userDocument = mongoose.model("userCollection", mSchema); // 'userCollection' named collections in the db named 'userDatabase'

// VIEW ENGINE
app.set("view engine", "ejs");

//MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //middleware to take inputs from forms when done submitting.
app.use(express.static(path.join(path.resolve(), "public"))); // telling where the static files live, in this case inside the public folder | it's a middleware
app.use(cookieParser()); // for req.cookies to work, we need it.

let authenticate = async (req, res, next) => {
  // const { mail, id, uname } = req.cookies; //this destructuring will work too, but writing extra parameters which doesn't exist will not serve any purpose, in this case mail & uname are extras, which doesn't exist in req.cookies object.

  const { id } = req.cookies; //destructuring the req.cookies object

  // if (mail && uname && id) {
  if (id) {
    const decodedId = jwt.verify(id, process.env.JWT_Secret);

    req.xyz = await userDocument.findById(decodedId.id1);

    next();
  } else {
    res.render(`home`);
  }
};

app.get("/", authenticate, (req, res, next) => {
  // res.send(` <h1 style="color:rgb(189, 7, 68);">Home Page</h1>`);
  let { uname, email } = req.xyz;
  res.render(`logout`, { n: uname, e: email });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  let { uname, email, pass } = req.body; // it's an object

  let user1 = await userDocument.findOne({ email });
  if (user1) {
    return res.render("login", {
      message: "Email already registered, Please Login",
    });
  }

  const hashedPassword = await bcrypt.hash(pass, 10);
  let user = await userDocument.create({
    uname,
    email,
    pass: hashedPassword,
    pass1: pass,
  }); // returns a promise

  const userToken = jwt.sign({ id1: user._id }, process.env.JWT_Secret);

  res.cookie("id", userToken, {
    httpOnly: true,
  });

  res.render(`logout`, { n: uname, e: email });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res, next) => {
  let { pass, email } = req.body; // it's an object
  // name & email are the name attributes of input tag

  let user = await userDocument.findOne({ email });
  if (!user) {
    return res.render("register", {
      message: "Email not found, Register Yourself",
    });
  }
  let isMatch = await bcrypt.compare(pass, user.pass);
  if (!isMatch) {
    return res.render("login", {
      message: "Wrong Password, Try again",
    });
  }
  const userToken = jwt.sign({ id1: user._id }, process.env.JWT_Secret);

  res.cookie("id", userToken, {
    httpOnly: true,
  });

  res.render(`logout`, { n: user.uname, e: email });
});

app.get("/logout", (req, res, next) => {
  // res.cookie("uname", null, {
  //   httpOnly: true,
  //   expires: new Date(
  //     Date.now()
  //   ) /* this line is deleting the cookie & not the null value*/,
  // });
  // res.cookie("mail", null, {
  //   httpOnly: true,
  //   expires: new Date(Date.now()),
  // });
  res.cookie("id", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.redirect("/");
});
//rendering logout.ejs inside views foder. We are using views folder to keep dynamic html files, using template engines, in our case, it's ejs.

app.get("/users", (req, res) => {
  res.send("It's working");
});
app.get("/users/all", async (req, res) => {
  let users = [25, { g: "90", u: 90 }, ["io", 90]];
  users = await userDocument.find({});
  res.json({ success: true, users });
});

app.listen(process.env.PORT, () => {
  console.log("server started");
});
