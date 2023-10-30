export function footer(){
    let html=`
    <footer>
        <div class="footer-left">
            <p>123-456-7890</p>
            <div class="footer-links">
                <a href="www.google.com" class="link-secondary">Contact Us</a>
                <a href="#" class="link-secondary">Privacy Policy</a>
                <a href="#" class="link-secondary">Terms and Conditions</a>
            </div>
        </div>
        <div class="footer-center">
            <p>&copy; 2023 Markit</p>
        </div>

        <div class="footer-right">
            <img src="./Assests/markit_official_logo.png" alt="Markit Logo" id="footer-logo" />
        </div>
    </footer>
    `
    return html;
}