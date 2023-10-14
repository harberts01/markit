import { navBar } from './nav.js';
import { homePage } from './homePage.js';

const appContainer = document.querySelector('.app')

const renderHomePage = () => {
    const html = `
    ${navBar()}
    ${homePage()}
    `;

    appContainer.insertAdjacentHTML('afterbegin', html);
    appContainer.style.opacity = 1;

};

renderHomePage();


