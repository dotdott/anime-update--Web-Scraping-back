"use strict";

const EpisodesList = use("App/Models/EpisodesList");
const puppeteer = require("puppeteer");

class EpisodeListController {
  async list({ response, request }) {
    try {
      const { page } = request.only(["page"]);

      const hasPageParams = Object.keys(page).length > 0;

      const list = await EpisodesList.query()
        .orderBy("id", "desc")
        .paginate(hasPageParams ? page : 1);

      return response.status(200).send({ list });
    } catch (err) {
      return response.status(400).send({
        error: "An error has ocurried when trying to fetch last episodes list!",
      });
    }
  }

  async runPuppeteer({ response }) {
    try {
      const list = await EpisodesList.query().orderBy("id", "desc").paginate(1);

      const { data } = list.toJSON();

      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();
      await page.goto("https://animesup.biz/", {
        waitUntil: "networkidle2",
      });

      const pupList = await page.evaluate(async () => {
        const lastEpisodesList = document.querySelectorAll(
          ".animation-2.items .item.se.episodes"
        );

        const episodesArray = [...lastEpisodesList];
        const formattedArray = [];

        if (episodesArray.length > 0) {
          episodesArray.map(async (item) => {
            const img_src = item.querySelector("img").getAttribute("data-src");
            const name = item.querySelector(".data h3 a").innerHTML;
            const episode = item.querySelector(".data span").innerHTML;
            const episode_link = item.querySelector(".poster a").href;
            const last_update = new Date().toLocaleString();

            if (formattedArray.length > 0) {
              const checkIfDataIsAlreadyInArray = formattedArray.every(
                (lastUpdats) => lastUpdats.name === name
              );

              if (checkIfDataIsAlreadyInArray) return;
            }

            formattedArray.push({
              img_src,
              name,
              episode,
              episode_link,
              last_update,
            });

            return formattedArray;
          });

          return formattedArray;
        }
      });

      const handleFormatList = () => {
        let newArr = [];

        pupList.map((item) => {
          const alreadyInDatabase = data.some(
            (dataItem) =>
              dataItem.name === item.name && dataItem.episode === item.episode
          );

          if (!alreadyInDatabase) {
            return newArr.push(item);
          }

          return;
        });

        return newArr;
      };

      const formattedArray = handleFormatList();
      if (formattedArray.length === 0) {
        throw new Error("Parece que já está tudo atualizado!");
      }
      const updatedList = await EpisodesList.createMany(pupList);

      return response.status(200).send({ updatedList });
    } catch (error) {
      let msg = "Houve um erro ao tentar listar as ultimas atualizações";

      if (error.message === "Parece que já está tudo atualizado!") {
        msg = error.message;
      }

      return response.status(400).send({ error: msg });
    }
  }
}

module.exports = EpisodeListController;
