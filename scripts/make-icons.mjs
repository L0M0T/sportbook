import { readFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg");
mkdirSync("public/icons", { recursive: true });

await sharp(svg).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(svg).resize(512, 512).png().toFile("public/icons/icon-512.png");
await sharp(svg).resize(180, 180).png().toFile("public/icons/apple-touch-icon.png");

const inner = await sharp(svg).resize(360, 360).png().toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: "#07080b",
  },
})
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile("public/icons/maskable-512.png");

console.log("icons ok");
