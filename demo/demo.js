const bel = require('bel')
const csjs = require('csjs-inject')
const protocol_maker = require('protocol-maker')
const { setMonth, getYear, getDaysInMonth } = require('date-fns')
// widgets
const calendarMonth = require('datdot-ui-month-selector')
const calendarDays = require('..')

var id = 0

module.exports = demo

function demo () {
	
  const contacts = protocol_maker('demo', listen)
  function listen (msg) {
    const { head, refs, type, data, meta } = msg // receive msg
    const [from] = head
    const name = contacts.by_address[from].name
    console.log('demo', { type, from, name, msg, data })
		if (type === 'click') handle_click(name, data.name)
    if (type === 'value-first' || type === 'value-second') return handle_selection(from, type, data)
    if (type === 'clear') return clearAll()
	}

  // elements	
	const current_state = {
		first: { pos: 1, value: null },
		second:	{ pos: 7, value: null }
	}
	const month_name1 = `cal-month-1`
	const days_name1 = `cal-days-1`

  const date1 = setMonth(new Date(), current_state.first.pos)
  current_state.first.days = getDaysInMonth(date1)
  current_state.first.year = getYear(date1)

  const cal_month1 = calendarMonth({ pos: current_state.first.pos }, contacts.add(month_name1))
  let cal_days1 = calendarDays({
    name: days_name1, 
    year: current_state.first.year,
    month: current_state.first.pos, 
    days: current_state.first.days,
    start_cal: true 
  }, contacts.add(days_name1))
  
	const weekList= ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const container = bel`<div class=${css['calendar-container']}></div>`

	const cal1 = bel`<div class=${css.calendar}>${cal_month1}${makeWeekDays()}${cal_days1}</div>`
  container.append(cal1)

  const demo = bel`<div class=${css.datepicker}> <div class=${css["calendar-header"]}></div> ${container} </div>`
  demo.onclick = (e) => handle_demo_onclick(e)
  
  return demo

  function makeWeekDays () {
    const el = bel`<section class=${css['calendar-weekday']} role="weekday"></section>`
    weekList.map( w => {
      let div = bel`<div class=${css['calendar-week']} role="week">${w.slice(0 ,1)}</div>`
      el.append(div)
    })
    return el
  }

  function handle_demo_onclick (event) {
    const target = event.target.tagName
    if (target === 'CALENDAR-DAYS' || target === 'CALENDAR-MONTH') return
    clearAll()
  } 

  function handle_click (name, target) {
    // if (current_state.first.value || current_state.second.value) return clearAll()
    const $cal_month = contacts.by_name[name]
    let $cal_days
    let new_pos
    if (name === month_name1) {
      if (current_state.first.value) return
      $cal_days = contacts.by_name[days_name1]
      if (target === 'prev') new_pos = current_state.first.pos - 1
      else if (target === 'next') new_pos = current_state.first.pos + 1
      current_state.first.pos = new_pos
    }
    $cal_month.notify($cal_month.make({ to: $cal_month.address, type: 'update', data : { pos: new_pos } }))
    $cal_days.notify($cal_days.make({ to: $cal_days.address, type: 'update', data: { pos: new_pos } }))
  }
  
  function clearAll () {
    const keys = get_all_cal_names()
    keys.forEach(key => {
      const name = contacts.by_name[key].name
      const $name = contacts.by_name[name]
      $name.notify($name.make({ to: $name.address, type: 'clear' }))
    })
    current_state.first.value = null
    current_state.second.value = null
  }


  function handle_selection (from, type, data) {
    const name = contacts.by_address[from].name
    if (type === 'value-first') {
      if (name === 'cal-days-1') {
        current_state.first.value = data.body
        type = 'first-selected-by-startcal'
       } else {
        current_state.second.value = data.body
        type = 'first-selected-by-endcal' 
      }
    } else if (type === 'value-second') {
      type = 'second-selected'
      if (name === 'cal-days-1') {
        current_state.first.value = data.body
       } else {
        current_state.second.value = data.body
      }
    }
		const keys = get_all_cal_names()
		keys.forEach(key => {
			const cal_name = contacts.by_name[key].name
			if (cal_name === name) return
			const $name = contacts.by_name[cal_name]
			$name.notify($name.make({ to: $name.address, type, date: { data } } ))
		})
  }

	function get_all_cal_names () {
		const keys = Object.keys(contacts.by_name)
		return keys.filter(key => contacts.by_name[key].name.includes('cal-days'))
	}

}

const css = csjs`
html {
	height: 100%;
}
body {
	margin: 0;
	padding: 0;
	font-family: Arial, Helvetica, sans-serif;
	background-color: #F2F2F2;
	height: 100%;
}
.datepicker {
    position: relative;
    background-color: white;
    height: 100%;
}
.datepicker-body {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: repeat(2, 210px);
    grid-gap: 35px;
}
.btn {
    background: none;
    border: none;
    border-radius: 50px;
    width: 30px;
    height: 30px;
    padding: 0;
    transition: background-color 0.3s ease-in-out;
    cursor: pointer;
}
.btn:active, .btn:hover {
    background-color: #C9C9C9;
}
.prev {}
.next {}
.icon svg path {
    transition: stroke 0.25s ease-in-out;
}
.icon-prev {}
.icon-next {}
.calendar-header {
    position: absolute;
    z-index: 9;
    display: flex;
    justify-content: space-between;
    width: 100%;
}
.calendar-container {
    display: flex;
}
.calendar-weekday {
    display: grid;
    grid-template-rows: 30px;
    grid-template-columns: repeat(7, minmax(30px, auto));
    justify-items: center;
    font-size: 12px;
}
.calendar-week {
    
}
.calendar {
    margin-left: 30px;
}
.title {
    font-size: 18px;
    text-align: center;
}
`

document.body.append(demo())