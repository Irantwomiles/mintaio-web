import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import {getFriendlyDate, getUpcomingMints} from "../../utils/utils";
import Calendar from "tui-calendar";
import 'tui-calendar/dist/tui-calendar.min.css';
import logo from '../../images/mintaio-logo.png';

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getTimePassed(time) {
    const now = new Date().getTime();
    const before = new Date(time).getTime();

    const passedTime = Math.floor((now - before) / (1000 * 60));

    if(passedTime === 1) {
        return 'about 1 minute ago';
    } else if(passedTime > 1) {
        return `${passedTime} minutes ago`;
    } else {
        return `less than a minute ago`
    }
}

function Dashboard({state}) {

    const [upcomingMints, setUpcomingMints] = useState([]);
    const [todaysMints, setTodaysMints] = useState([]);
    const [calendar, setCalendar] = useState(null);
    const [mintingData, setMintingData] = useState([]);
    const [userData, setUserData] = useState(null);

    const loadMintingDates = async () => {
        const data = await state.getUpcomingMintingData();
        const _todaysMints = [];

        const date = new Date();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        for(const d of data) {
            const mintDate = new Date(d.mintDate);
            if(mintDate.getDate() === day && (mintDate.getMonth() + 1) === month) {
                _todaysMints.push(d);
            }
        }

        setTodaysMints(_todaysMints);
        setUpcomingMints(data);
    }

    const handleBrokenImage = (event) => {
        event.target.src = logo;
    }

    useEffect(() => {
    }, [mintingData])

    useEffect(() => {

        if(calendar === null || upcomingMints.length === 0) return;

        const schedules = [];

        for(let i = 0; i < upcomingMints.length; i++) {

            const data = upcomingMints[i];

            schedules.push(
                {
                    id: i + 1,
                    //calendarId: '1',
                    title: data.name,
                    category: 'time',
                    start: new Date(data.mintDate),
                    end:  new Date(data.mintDate + (1000 * 60 * 60 * 1)),
                    isReadOnly: false,    // schedule is read-only
                    bgColor: `${getRandomColor()}`,
                    color: 'rgba(255,255,255,0.79)'
                }
            )

        }

        calendar.createSchedules(schedules);

        calendar.on('afterRenderSchedule', (event) => {
            const elements = document.querySelectorAll(`[data-schedule-id='${event.schedule.id}']`);

            if(elements.length > 0) {
                for(const element of elements) {
                    element.querySelector('.tui-full-calendar-weekday-schedule-bullet').style.display = "none";
                    element.querySelector('.tui-full-calendar-weekday-schedule-title').style.color = event.schedule.color;
                    element.style.backgroundColor = event.schedule.bgColor;
                    element.style.borderRadius = '0.5rem';
                }
            }
        })

    }, [calendar, upcomingMints])

    useEffect(() => {

        const _calendar = new Calendar('#calendar', {
            defaultView: 'month',
            useDetailPopup: true,
            useCreationPopup: true,
            scheduleView: ['time'],
            isReadOnly: true
        })

        setCalendar(_calendar);

        loadMintingDates();

        const transferStream = state.openSeaTransferStream.subscribe((data) => {
            setMintingData([...data]);
        })

        state.connectOpenSeaTransfer();

        const _user = localStorage.getItem('discord-user');

        if(_user !== null) {
            setUserData(JSON.parse(_user));
        }

        return () => {
            transferStream.unsubscribe();
        }


    }, []);

    return html`
        
        <div class="p-3 w-100 dashboard view-container">
            
            <div class="dashboard-banner p-4">
                <div class="banner-date">${getFriendlyDate()}</div>
                <div>Welcome back, <span>${userData === null ? 'MintAIO' : userData.username}#${userData === null ? '1234' : userData.discriminator}</span></div>
            </div>
            
            <div class="dashboard-content mt-3">

                <div class="left-content p-4 me-2">
                    
                    <div style="color: white; font-weight: bold; font-size: 1.5rem;">Today's Mints</div>

                    <div class="today-mints">
                        <div class="project-list d-flex">

                            ${
                                todaysMints.length > 0 ?
                                    todaysMints.map(mint => (
                                            html`

                                                <div class="d-flex" style="border-radius: 0.5rem;">
                                                    <div class="project p-2 me-2 mb-2">
                                                        <div style="position: relative;">
                                                            <div class="image-banner">
                                                                <img src=${mint.twitterBannerImage}
                                                                     onerror=${handleBrokenImage}/>
                                                            </div>
                                                            <div class="image">
                                                                <img src=${mint.twitterProfileImage}
                                                                     onerror=${handleBrokenImage}/>
                                                            </div>
                                                        </div>

                                                        <div class="project-name mt-2 d-flex justify-content-between align-items-center">
                                                            <div>${mint.name}</div>
                                                            <div>
                                                                <a class="me-1 ${mint.discordUrl !== null && mint.discordUrl.length > 0 ? '' : 'd-none'}"
                                                                   href=${mint.discordUrl !== null && mint.discordUrl.length > 0 ? `${mint.discordUrl}` : ''}
                                                                   target="_blank">
                                                                    <i class="fa-brands fa-discord"
                                                                       style="color: #7289DA;"></i>
                                                                </a>
                                                                <a class="me-1 ${mint.twitterUrl !== null && mint.twitterUrl.length > 0 ? '' : 'd-none'}"
                                                                   href=${mint.twitterUrl !== null && mint.twitterUrl.length > 0 ? `${mint.twitterUrl}` : ''}
                                                                   target="_blank">
                                                                    <i class="fa-brands fa-twitter"
                                                                       style="color: #00acee;"></i>
                                                                </a>
                                                                <a class="me-1 ${mint.osUrl !== null && mint.osUrl.length > 0 ? '' : 'd-none'}"
                                                                   href=${mint.osUrl !== null && mint.osUrl.length > 0 ? `${mint.osUrl}` : ''}
                                                                   target="_blank">
                                                                    <img style="height: 1.3rem; width: 1.3rem;"
                                                                         src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg"/>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                            `
                                    ))
                                :
                                        html`
                                        <div class="label">Not mints today</div>
                                        `
                            }

                        </div>
                    </div>

                    <hr />
                    
                    <div class="upcoming-calendar mt-3">
                        <div style="color: white; font-weight: bold; font-size: 1.5rem;">Upcoming Mints</div>
                        <div id="calendar"></div>
                    </div>
                        

                </div>
                
                <div class="right-content p-4">

                    <div style="color: white; font-weight: bold; font-size: 1.5rem;">Minting Live</div>
                    
                    <div class="minting-live">
                        
                        ${
                            mintingData.map(mint => (
                                html`
                                    <div class="mint d-flex p-2 my-2">
                                        <img class="logo me-2" src=${mint.payload.item.metadata.image_url} onerror=${handleBrokenImage} />
                                        <div class="d-flex align-items-center justify-content-between w-100">
                                            <div class="mint-name">
                                                <div class="name">${mint.payload.item.metadata.name}</div>
                                                <div class="time">${getTimePassed(mint.sent_at)}</div>
                                            </div>
                                            <div class="d-flex align-items-center">
                                                <a class="me-1" href=${mint.payload.item.permalink} target="_blank"><img style="height: 1.3rem; width: 1.3rem;" src="https://storage.googleapis.com/opensea-static/Logomark/Logomark-Blue.svg" /></a>
                                                <a class="${mint.payload.transaction !== null ? '' : 'd-none'}" href="https://etherscan.io/tx/${mint.payload.transaction !== null ? mint.payload.transaction.hash : ''}" target="_blank"><img style="height: 1.3rem; width: 1.3rem;" src="https://etherscan.io/images/brandassets/etherscan-logo-circle.png" /></a>
                                            </div>
                                        </div>
                                    </div>
                                `
                            ))
                        }
                       
                    </div>
                </div>
                
            </div>
            
            
        </div>
        
    `
}

export default Dashboard;