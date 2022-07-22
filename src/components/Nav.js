import {html} from 'htm/preact';

function Nav() {
    return html`
        <nav class="navbar navbar-expand-lg navbar-light p-3">
            <a class="navbar-brand" href="#">Navbar</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
                <div class="ms-auto navbar-nav">
                    <a class="nav-item nav-link" href="#">Security</a>
                    <a class="nav-item nav-link" href="#">About</a>
                </div>
            </div>
        </nav>
    `
}

export default Nav;