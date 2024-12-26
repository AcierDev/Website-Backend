require("dotenv").config();

export function getStandardHeader(accessToken: string) {
  return {
    "x-api-key": process.env.ETSY_API_KEY,
    Authorization: `Bearer ${accessToken}`,
  };
}
