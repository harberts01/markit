export function navBar() {
  let html = `<!-- Navbar -->
  <nav class="navbar navbar-expand-lg" style="background-color: #fff5f5">
    <div class="container-fluid">
      <a class="navbar-brand" href="#">
        <img id="nav-logo" src="Assests/markit_official_logo.png"/>
      </a>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link" aria-current="page" href="#highlights-container">About</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#section1-container">Features</a>
          </li>
          <li class="nav-item">
            <a id="find-your-market" class="nav-link" href="#">Find Your Market</a>
          </li>
        </ul>
        <form class="d-flex">
          <button id="nav-login" href="#">
            <span id="login-txt">Login</span>
          </button>
          <button class="btn btn-outline-success" id="nav-btn" type="submit">
            <span id="nav-btn-txt">Become a Market Manager</span>
          </button>
        </form>
      </div>
    </div>
  </nav>`;
  return html ;
}
