import { navBar } from "./nav.js";
import { footer } from "./footer.js";

export function becomeMarketManager(){
    let html = `
    ${navBar()}
    <div class="container-fluid">
        <div class="row">
            <div class="col-8">
                <h1 class="text-center">Become a Market Manager</h1>
            </div>
            <div class="col-4">
                <div class="card">
                    <div class="row">
                        <div class="card-header">
                            <h2>Why Partner with Markit?</h2>
                        </div>
                        <div class="card-body">
                            <div class="card-title">
                                <h3>Enhanced Markit Promotion</h3>
                            </div>
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