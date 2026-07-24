const path = require("node:path");
const fs = require("node:fs");

async function main() {
  const htmlPath = path.join(__dirname, "..", "docs", "presentacion-autotech-v12.html");
  const pdfPath = path.join(__dirname, "..", "docs", "presentacion-autotech-v12.pdf");

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`No se encontró ${htmlPath}`);
  }

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const fileUrl = `file:///${htmlPath.replace(/\\/g, "/")}`;
    await page.goto(fileUrl, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    console.log(`PDF generado: ${pdfPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
