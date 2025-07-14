const { chromium } = require("playwright");
const fs = require("fs");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://branddb.wipo.int", { waitUntil: "load" });

  // Write brand name
  const inputs = page.locator("input.b-input__input");
  await inputs.nth(0).waitFor();
  await inputs.nth(0).fill("adidas");

  // Designation country alanına insan gibi "Türkiye" yaz
  const countryInput = inputs.nth(4);
  await countryInput.click();
  await countryInput.type("Germany", { delay: 150 }); // insan gibi

  // Dropdown beklenip Türkiye seçeneği tıklanır
  await page.waitForSelector("ul.suggestionList li", { timeout: 5000 });
  await page
    .locator("ul.suggestionList li", { hasText: "(DE) Germany" })
    .click();
  console.log("Germany seçildi.");

  // Arama başlat
  await page.locator("button.search").click();
  await page.waitForTimeout(5000);

  const allResults = [];
  let currentPage = 1;

  while (currentPage <= 5) {
    console.log(`Sayfa ${currentPage} işleniyor...`);

    const itemCount = await page.evaluate(() => {
      return document.querySelectorAll("li.flex.result.wrap.ng-star-inserted")
        .length;
    });

    for (let i = 0; i < itemCount; i++) {
      const itemLocator = page
        .locator("li.flex.result.wrap.ng-star-inserted")
        .nth(i);
      await itemLocator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);

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

      allResults.push(itemData);
    }

    const nextButton = page.locator("button.next");
    const isEnabled = await nextButton.isEnabled().catch(() => false);
    const isVisible = await nextButton.isVisible().catch(() => false);

    if (currentPage < 5 && isEnabled && isVisible) {
      await nextButton.click();
      await page.waitForTimeout(5000);
      currentPage++;
    } else {
      break;
    }
  }

  fs.writeFileSync(
    "results.json",
    JSON.stringify(allResults, null, 2),
    "utf-8"
  );
  console.log(
    `${allResults.length} kayıt başarıyla results.json dosyasına yazıldı.`
  );

  await browser.close();
})();
