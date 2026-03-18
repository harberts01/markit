import { navBar } from "./nav.js";
import { footer } from "./footer.js";

export function becomeMarketManager(){
    let html = `
    ${navBar()}
    <div class="container" id="become-market-manager">
        <div class="row">
            <div class="col-8">
                <h1>Lets get connected!</h1>
                <form id="first_name">
                    <div class="input-wrapper">
                        <label for="first">First Name</label>
                        <input type="text" />
                    </div>
                    <div class="input-wrapper">
                        <label for="last">Last Name</label>
                        <input type="text" />
                    </div>
                    <div class="input-wrapper">
                        <label for="market">Market Name</label>
                        <input type="text" />
                    </div>
                    <div class="input-wrapper">
                        <label for="zipCode">Zip Code</label>
                        <input type="text" />
                    </div>
                    <div class="input-wrapper">
                        <label for="phone">Phone Number</label>
                        <input type="text" />
                    </div>
                    <div class="input-wrapper">
                        <label for="email">Email Address</label>
                        <input type="text" />
                    </div>
                    <div class="input-wrapper">
                        <label for="comments">Comments</label>
                        <input type="text" />
                    </div>
                </form>
            </div>
            <div class="col-4">
                <div class="card">
                    <div class="row">
                        <div class="card-header" id="mm-card-header">
                            <h2>Why Partner with Markit?</h2>
                        </div>
                        <div class="card-body">
                            <div class="card-title">
                                <h3>Enhanced Market Promotion</h3>
                            </div>
                            <div class="card-text">
                            <p>Promoting your market becomes easier with a dedicated app. You can showcase upcoming special events, featured vendors, and attracting a larger customer base and driving turnout. The app's notification system ensures that market updates reach a wide audience.</p></div>



                        </div>
                    </div>
                    <div class="row">
                        <div class="card-body">
                            <div class="card-title">
                                <h3>Sustainability and Community Support</h3>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="card-body">
                            <div class="card-title">
                                <h3>Increased Vendor Engagement</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    ${footer()}
    `
    return html;
}