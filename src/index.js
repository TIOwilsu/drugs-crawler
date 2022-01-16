const chalk = require("chalk");
const {
  sleep,
  fetchData,
  getLinks,
  setDrug,
  setInteration,
  updateInteraction,
} = require("./utils");

const mongoose = require("mongoose");
const { Drug, Interaction } = require("./model");

mongoose
  .connect("mongodb://localhost:27017/test")
  .then(() => console.log(chalk.green("CONECTED DB")))
  .catch((err) => console.log(err));

fetchData()
  .then(({ data }) =>
    getLinks(data, "#tab-section-1 .ddc-paging > li:not(:last-child)")
  )
  .then(async (links) => {
    for (const link of links) {
      await sleep();
      await fetchData(link)
        .then(({ data }) => getLinks(data, "#content .ddc-list-column-2 > li"))
        .then(async (links) => {
          for (const link of links) {
            await sleep();
            await fetchData(link)
              .then(async (res) => {
                const { responseUrl } = res.request.res;
                let drug = await Drug.findOne({ url: responseUrl }).exec();
                if (!drug) {
                  drug = await setDrug(res);
                } else {
                  console.log(chalk.yellow("This drug already exist!"));
                }
                return drug;
              })
              .then(async (drug) => {
                await sleep();
                await fetchData(drug.urlDrugInterations)
                  .then(({ data }) =>
                    getLinks(data, "#content .interactions > li")
                  )
                  .then(async (links) => {
                    for (const link of links) {
                      await sleep();
                      await fetchData(link).then(async (res) => {
                        const { responseUrl } = res.request.res;
                        const interaction = await Interaction.findOne({
                          url: responseUrl,
                        }).exec();

                        const idDrug = drug?._id.toString();
                        const idInteraction = interaction?.key.a.toString();

                        if (!interaction) {
                          await setInteration({ res, id: drug._id });
                        }

                        if (idInteraction === idDrug) {
                          console.log(
                            chalk.yellow("This interaction already exist!")
                          );
                        }

                        if (interaction && idInteraction !== idDrug) {
                          await updateInteraction(drug, interaction);
                        }
                      });
                    }
                  });
              });
          }
        });
    }
  });
