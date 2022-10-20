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

function Dashboard({state}) {

    const [upcomingMints, setUpcomingMints] = useState([]);
    const [todaysMints, setTodaysMints] = useState([]);
    const [calendar, setCalendar] = useState(null);

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

        console.log(_todaysMints);

        setTodaysMints(_todaysMints);
        setUpcomingMints(data);
    }

    const handleBrokenImage = (event) => {
        event.target.src = logo;
    }

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

    }, []);

    return html`
        
        <div class="p-3 w-100 dashboard">
            
            <div class="dashboard-banner p-4">
                <div class="banner-date">${getFriendlyDate()}</div>
                <div>Welcome back, <span>Irantwomiles#1948</span></div>
            </div>
            
            <div class="dashboard-content">
            
                <div class="left-content">
                    
                    <div>Today's Mints</div>
                    
                    <div class="today-mints">
                        
                        ${
                            todaysMints.map(mint => (
                                html`
                                    <div class="project p-4 col-3 m-2">
                                        <img src=${mint.twitterProfileImage} onerror=${handleBrokenImage} />
                                        <div>${mint.name}</div>
                                    </div>
                                
                                `
                            ))
        
                        }
                        
                    </div>
                    
                    <div id="calendar" class="upcoming-calendar" style="border-radius: 0.5rem;" >
                    </div>
                    
                </div>
                
                <div class="right-content">
                    <div class="upcoming-mints">
                        
                    </div>
                </div>
                
            </div>
            
            
        </div>
        
    `
}

export default Dashboard;