const http = require("./http");
const cheerio = require("cheerio");
const chalk = require("chalk");
const { promisify } = require("util");
const { Drug, Interaction } = require("./model");

const sleep = async (timeout = 60000) => promisify(setTimeout)(timeout);

const fetchData = async (url) => {
  console.log(chalk.blue("Crawling data..."));
  let response = "";
  try {
    response = await http.get(url).catch((err) => console.log(err));
  } catch {
    console.log(chalk.red("Error occurred while fetching data"));
    return;
  }
  return response;
};

const getLinks = (html, selector) => {
  const $ = cheerio.load(html);
  const items = $(selector);
  const hrefs = [];
  items.each(function () {
    const $a = $(this).find("a");
    hrefs.push($a.attr("href"));
  });
  return hrefs;
};

const setDrug = async ({ data: html, request }) => {
  try {
    const $ = cheerio.load(html);
    const $content = $("#content .contentBox");
    const $name = $content.find("h1");
    const $linkDrugInterations = $content.find(
      '#moreResources a:contains("Drug Interactions")'
    );
    const paragraphs = [...$content.find("p")];
    const subtitles = paragraphs
      .map((paragraph, index) => {
        const $paragraph = $(paragraph);
        const $h2 = $paragraph.prev().is("h2") && $paragraph.prev();
        const id = $h2 && $h2.attr("id");
        const item = id && { id, index, title: $h2.text() };
        return item;
      })
      .filter((paragraph) => paragraph);

    const contents = subtitles.reduce((obj, subtitle, subtitleIndex) => {
      const texts = paragraphs
        .filter((paragraph, paragraphIndex) => {
          const subtitleNext = subtitles[subtitleIndex + 1];
          const ifLast = !subtitleNext && subtitle.index <= paragraphIndex;
          const ifBetween =
            subtitle.index <= paragraphIndex &&
            paragraphIndex < subtitleNext?.index;
          return ifLast || ifBetween;
        })
        .map((paragraph) => {
          const $paragraph = $(paragraph);
          return $paragraph.text();
        });

      obj[subtitle.id] = { title: subtitle.title, texts };
      return obj;
    }, {});

    const drug = new Drug({
      name: $name.text(),
      url: request.res.responseUrl,
      urlDrugInterations: $linkDrugInterations?.attr("href"),
      ...contents,
    });

    await drug.save((err, doc) => {
      if (err) return console.error(err);
      console.log(chalk.green(`Drug ${$name.text()} inserted successfully!`));
    });

    return drug;
  } catch (err) {
    console.log(err);
  }
};

const setInteration = async ({ res, id }) => {
  try {
    const key = { a: id };
    const html = res.data;
    const { responseUrl } = res.request.res;
    const $ = cheerio.load(html);
    const $content = $("#content");
    const $drugs = $content.find("h1 + p + ul > li");
    const firstDrug = $drugs.first().text();
    const lastDrug = $drugs.last().text();
    const $wrapper = $content.find(".interactions-reference-wrapper").first();
    const $status = $wrapper.find(".ddc-status-label");
    const $description = $wrapper.find(".interactions-reference-header + p");

    const interaction = new Interaction({
      key,
      url: responseUrl,
      status: $status ? $status.text().toLowerCase() : "unknown",
      description: $description.text(),
    });

    await interaction.save((err, doc) => {
      if (err) return console.error(err);
      console.log(
        chalk.green(
          `Interaction ${firstDrug},${lastDrug} inserted successfully!`
        )
      );
    });

    return interaction;
  } catch (err) {
    console.log(err);
  }
};

const updateInteraction = async (anotherDrug, { key, url }) => {
  key.b = anotherDrug._id;
  const interaction = await Interaction.findOneAndUpdate({ url }, { key });
  const drug = await Drug.findOne({ _id: key.a });
  console.log(
    chalk.green(
      `Interaction between ${drug.name} and ${anotherDrug.name} updated successfully!`
    )
  );
  return interaction;
};

module.exports = {
  sleep,
  fetchData,
  getLinks,
  setDrug,
  setInteration,
  updateInteraction,
};
