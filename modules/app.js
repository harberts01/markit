import { homePage } from "./homePage.js";
import { findYourMarket } from "./findYourMarket.js";


const appContainer = document.querySelector(".app");
let isRenderHomePage = false;

const renderHomePage = () => {
  const html = `${homePage()}`;
  appContainer.insertAdjacentHTML("afterbegin", html);
  appContainer.style.opacity = 1;
  isRenderHomePage = true;


};

renderHomePage();
console.log(isRenderHomePage);

const findYourMarketBtn = document.querySelector("#find-your-market");
  findYourMarketBtn.addEventListener("click", () => {
    findYourMarket();
  });



