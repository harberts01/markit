import { homePage } from "./homePage.js";
import { becomeMarketManager } from "./becomeMarketManager.js";


const appContainer = document.querySelector(".app");
let isRenderHomePage = false;
let isRenderBecomeMarketManager = false;

const renderHomePage = () => {
  const html = `${homePage()}`;
  appContainer.insertAdjacentHTML("afterbegin", html);
  appContainer.style.opacity = 1;
  isRenderHomePage = true;
};

renderHomePage();

const renderBecomeMarketManager = () => {
    const html = `${becomeMarketManager()}`;
    appContainer.insertAdjacentHTML("afterbegin", html);
    appContainer.style.opacity = 1;
    

};

let becomeMarketManagerBtn = document.getElementById("nav-btn");
becomeMarketManagerBtn.addEventListener("click", () => {
    appContainer.style.opacity = 0;
    setTimeout(() => {
      appContainer.innerHTML = "";
      renderBecomeMarketManager();
    }, 500)
    isRenderHomePage = false;
    isRenderBecomeMarketManager = true;
  });




console.log(isRenderHomePage);
console.log(isRenderBecomeMarketManager);