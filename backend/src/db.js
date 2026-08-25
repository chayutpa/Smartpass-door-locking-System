import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  
  // พิมพ์ค่าออกดูใน Logs ว่าเป็นอะไรกันแน่
  console.log("[MongoDB] Checking URI:", uri ? "URI is provided (length: " + uri.length + ")" : "URI is MISSING");

  if (!uri) {
    throw new Error("MONGODB_URI is not set in environment variables");
  }

  mongoose.connection.on("connected", () => {
    console.log("[MongoDB] connected to Atlas");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] disconnected, mongoose will retry automatically");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
}
