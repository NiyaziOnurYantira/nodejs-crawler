const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://branddb.wipo.int", { waitUntil: "load" });

  const inputs = page.locator("input.b-input__input");
  await inputs.nth(0).waitFor();
  await inputs.nth(0).fill("adidas");

  await page.locator("button.search").click();
  await page.waitForTimeout(5000);

  console.log("Her sonucu görünür hale getir ve veriyi oku...");

  const results = [];

  const itemCount = await page.evaluate(() => {
    return document.querySelectorAll("li.flex.result.wrap.ng-star-inserted")
      .length;
  });

  for (let i = 0; i < itemCount; i++) {
    const itemLocator = page
      .locator("li.flex.result.wrap.ng-star-inserted")
      .nth(i);
    await itemLocator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300); // render olması için bekle

    const itemData = await itemLocator.evaluate((item) => {
      const getText = (selector) => {
        const el = item.querySelector(selector);
        return el ? el.innerText.trim() : null;
      };

      return {
        Brand: getText(".brandName"),
        Owner: getText(".owner .value"),
        NiceClass: getText(".class .value"),
        IPR: getText(".ipr .value"),
        Country: getText(".designation .value"),
        Status: getText(".status .value"),
        Number: getText(".number .value"),
      };
    });

    results.push(itemData);
  }

  fs.writeFileSync("results.json", JSON.stringify(results, null, 2), "utf-8");
  console.log(
    ` ${results.length} kayıt başarıyla results.json dosyasına yazıldı.`
  );

  await browser.close();
})();
