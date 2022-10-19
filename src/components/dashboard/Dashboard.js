import {html} from 'htm/preact';
import {useEffect, useState} from "preact/compat";
import {getFriendlyDate, getUpcomingMints} from "../../utils/utils";
import Calendar from "tui-calendar";
import 'tui-calendar/dist/tui-calendar.min.css';

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
    const [calendar, setCalendar] = useState(null);

    const loadMintingDates = async () => {

        const mintingData = await (await getUpcomingMints()).json();
        setUpcomingMints(mintingData.data);

        console.log(mintingData.data);
    }

    useEffect(() => {

        if(calendar === null || upcomingMints.length === 0) return;

        const _schedules = [
            {
                id: '1',
                //calendarId: '1',
                title: 'One',
                category: 'time',
                start: new Date(new Date().getTime()),
                end:  new Date(new Date().getTime() + (1000 * 60 * 60 * 2)),
                isReadOnly: false,    // schedule is read-only
                bgColor: 'rgba(213,56,217,0.79)',
                color: 'rgba(255,255,255,0.79)'
            },
            {
                id: '2',
                //calendarId: '1',
                title: 'Two',
                category: 'time',
                start: new Date(new Date().getTime()),
                end:  new Date(new Date().getTime() + (1000 * 60 * 60 * 2)),
                isReadOnly: false,    // schedule is read-only
                bgColor: 'rgba(42,161,111,0.79)',
                color: 'rgba(255,255,255,0.79)'
            },
            {
                id: '3',
                //calendarId: '1',
                title: 'Three',
                category: 'time',
                start: new Date(new Date().getTime()),
                end:  new Date(new Date().getTime() + (1000 * 60 * 60 * 2)),
                isReadOnly: false,    // schedule is read-only
                bgColor: 'rgba(239,125,52,0.79)',
                color: 'rgba(255,255,255,0.79)'
            },
            {
                id: '4',
                //calendarId: '1',
                title: 'Four',
                category: 'time',
                start: new Date(new Date().getTime()),
                end:  new Date(new Date().getTime() + (1000 * 60 * 60 * 2)),
                isReadOnly: false,    // schedule is read-only
                bgColor: 'rgba(52,157,166,0.79)',
                color: 'rgba(255,255,255,0.79)'
            },
            {
                id: '5',
                //calendarId: '1',
                title: 'Five',
                category: 'time',
                start: new Date(new Date().getTime()),
                end:  new Date(new Date().getTime() + (1000 * 60 * 60 * 2)),
                isReadOnly: false,    // schedule is read-only
                bgColor: 'rgba(162,210,65,0.79)',
                color: 'rgba(255,255,255,0.79)'
            }
        ];

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
           // calendars: calendars,
            useDetailPopup: true,
            useCreationPopup: true,
            scheduleView: ['time']
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
                    
                    <div class="today-mints">
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