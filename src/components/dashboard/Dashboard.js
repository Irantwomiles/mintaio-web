import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import SidebarNav from "../SidebarNav";
import NFTDashboard from "./NFTDashboard";

function Dashboard({state}) {
    return html`
        <div class="d-flex" style="position: relative;">
            <${SidebarNav} page="dashboard" />
            
            <${NFTDashboard} state=${state} />
        </div>
    `
}

export default Dashboard;