import { navBar } from "./nav.js";
import { homePage } from "./homePage.js";
import { footer } from "./footer.js";

const appContainer = document.querySelector(".app");
const findYourMarket = document.querySelector(".find-your-market");
let isRenderHomePage = false;

const renderHomePage = () => {
  const html = `
    ${navBar()}
    ${homePage()}
    ${footer()}
    `;

  appContainer.insertAdjacentHTML("afterbegin", html);
  appContainer.style.opacity = 1;
  isRenderHomePage = true;
};

const renderFindYourMarket = () => {
  const html = `
        
    `;

  appContainer.insertAdjacentHTML("afterbegin", html);
  appContainer.style.opacity = 1;
};

renderHomePage();

console.log(isRenderHomePage);
console.log(navBar);
