import dotenv from "dotenv";

dotenv.config();

export const config = {
  database: {
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    uri: (username: string, password: string) =>
      `mongodb+srv://${username}:${password}@sharedcluster.ftf6xg6.mongodb.net/?retryWrites=true&w=majority&appName=SharedCluster`,
    mode: process.env.MODE,
  },
  email: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: "smtp.zoho.com",
    port: 465,
  },
  server: {
    port: 3003,
  },
  shipstation: {
    apiKey: process.env.NEXT_PUBLIC_SHIPSTATION_API_KEY,
    apiSecret: process.env.NEXT_PUBLIC_SHIPSTATION_API_SECRET,
  },
};
