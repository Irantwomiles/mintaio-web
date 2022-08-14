import {html} from 'htm/preact';
import logo from '../images/mintaio-logo.png';

function Nav() {
    return html`
        <nav class="navbar navbar-expand-lg navbar-light p-3">
            
            <img class="nav-logo" src=${logo} />
            
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
        </nav>
    `
}

export default Nav;