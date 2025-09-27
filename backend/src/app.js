import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));

import userRoutes from "./Routes/user.Routes.js";
app.use("/api/v1/users", userRoutes);

import authRoute from "./Routes/auth.route.js";
app.use("/api/v1/auths", authRoute);

import prescriptionRoute from "./Routes/prescription.route.js";
app.use("/api/v1/prescribe", prescriptionRoute);

import appointmentRoute from "./Routes/appointment.route.js";
app.use("/api/v1/appointment", appointmentRoute);

import woundRoute from "./Routes/wound.route.js";
app.use("/api/v1/wound", woundRoute);

app.get("/", (req, res) => {
  res.send("API is running...");
});
export { app };
