const protocol_maker = require('protocol-maker')
const { isToday, format, isPast, getDay, setMonth, getDate, getMonth, getYear, getDaysInMonth } = require('date-fns')
const button = require('datdot-ui-button')

var id = 0
var count = 0
const sheet = new CSSStyleSheet()
const default_opts = {
	name: 'calendar-days',
	month: init_date().month,
	days: init_date().days,
	year: init_date().year,
	status: 'cleared',
	value: null,
	start_cal: true,
	theme: get_theme()
}
sheet.replaceSync(default_opts.theme)

module.exports = calendar_days

calendar_days.help = () => { return { opts: default_opts } }


function calendar_days (opts, parent_wire) {
	const { 
		name = default_opts.name,
		month = default_opts.month,
		days = default_opts.days,
		year = default_opts.year,
		status = default_opts.status,
		value = default_opts.value,
		start_cal = default_opts.start_cal,
		theme = '' } = opts

	const current_state =  { opts: { name, month, days, year, status, value, start_cal, sheets: [default_opts.theme, theme] } }
  
  // protocol
  const initial_contacts = { 'parent': parent_wire }
  const contacts = protocol_maker('input-number', listen, initial_contacts)
  
  function listen (msg) {
		const { head, refs, type, data, meta } = msg // receive msg
		const [from, to] = head
		const name = contacts.by_address[from].name
		console.log('Cal days', { type, name, msg, data })
		// handlers
		if (type === 'click') onclick(contacts.by_name[name].pos)
		if (type === 'clear') return clear_self()
		if (type === 'selecting-second') return colorRange(0, current_state.opts.value)
		if (type === 'first-selected-by-startcal') return setStatus('first-selected-by-startcal')
		if (type === 'first-selected-by-endcal') return setStatus('first-selected-by-endcal')
		if (type === 'second-selected') return setStatus('second-selected-by-other')
		if (type === 'color-from-start') return colorRange(0, current_state.opts.value)
		if (type === 'color-to-end') return colorRange(current_state.opts.value, days + 1)
		if (type === 'update') return update_cal(data)
		// if (type === 'color-range-from-start') return 
		// if (type === 'color-range-to-end') return 
		// if (type === 'not-selecting-second') {}
  }

	const $parent = contacts.by_name['parent']

  // calendar days
	const el = document.createElement('calendar-days')
	const shadow = el.attachShadow({mode: 'closed'})

	const { calendar, buttons } = make_calendar()
	// let buttons = [...calendar.children]
	adjust_cal_to_month()
	calendar.onmousemove = onmousemove
	// calendar.onclick = onclick
	calendar.onmouseleave = onmouseleave
	calendar.onmouseenter = onmouseenter

	// document.body.onclick = clear_all

	const custom_theme = new CSSStyleSheet()
	custom_theme.replaceSync(theme)
	shadow.adoptedStyleSheets = [sheet, custom_theme]

	shadow.append(calendar)
	return el
	
// event handlers
function onmousemove (event) {
	console.log('onmousemove - current status', name, current_state.opts.status)
	const btn = event.target
	const num = parseInt(btn.dataset.num)
	if (!num || btn.classList.value.includes('disabled-day')) return
	if (current_state.opts.status === 'first-selected-by-self') return markRange(current_state.opts.value, num)
	if (current_state.opts.status === 'first-selected-by-startcal') return markRange(0, num)
	if (current_state.opts.status === 'first-selected-by-endcal') return markRange(num, current_state.opts.days + 1)
}
function onclick (pos) {
	// event.stopPropagation()
	// const btn = event.target
	const btn = buttons[pos]
	if (!pos || btn.classList.value.includes('disabled-day')) return
	console.log('onclick - current status', current_state.opts.status, pos )
	if (current_state.opts.status === 'cleared') return selectFirst(btn, pos)
	if (current_state.opts.status === 'first-selected-by-self') return selectSecond(btn, pos)
	if (current_state.opts.status === 'first-selected-by-startcal') return selectSecond(btn, pos)
	if (current_state.opts.status === 'first-selected-by-endcal') return selectSecond(btn, pos)
	if (current_state.opts.status === 'second-selected-by-self') return selectFirst(btn, pos)
	if (current_state.opts.status === 'second-selected-by-other') return selectFirst(btn, pos)
}
function onmouseleave (event) {
	console.log('onmouseleave - first selected', current_state.opts.status)
	if (current_state.opts.status === 'first-selected-by-startcal') return unmark_self()
	if (current_state.opts.status === 'first-selected-by-endcal') return unmark_self()
	if (current_state.opts.status === 'first-selected-by-self') {
		// current_state.opts.value = void 0
		if (current_state.opts.start_cal) markRange(current_state.opts.value, current_state.opts.days + 1)
		else markRange(0, current_state.opts.value)
	}
}
function onmouseenter (event) {
	console.log('onmouseenter - first selected', current_state.opts.status)
	if (current_state.opts.status === 'first-selected-by-startcal') return notifyOther()
	if (current_state.opts.status === 'first-selected-by-endcal') return notifyOther()
}

	// helpers
	function unmark_self () {
		const len = Object.keys(buttons).length
		for (var i = 1; i < len + 1; i++) {
			buttons[i].classList.remove('date-in-range')
			buttons[i].classList.remove('date-selected')
		}		
		current_state.opts.value = void 0
		// remove just selection and styling, don't reset the status
	}

	function clear_self () {
		current_state.opts.status = 'cleared'
		unmark_self()
	}

	function clear_all () {
		$parent.notify($parent.make({ to: $parent.address, type: 'clear', data: { body: '' } }))
	}

	function selectFirst (btn, current) {
		clear_all()
		btn.classList.add('date-selected')
		setStatus('first-selected-by-self')
		current_state.opts.value = current
		$parent.notify($parent.make({ to: $parent.address, type: 'value-first', data: { body: [current_state.opts.year, current_state.opts.month+1, current_state.opts.value] } }))
	}

	function selectSecond (btn, current) {
		btn.classList.add('date-selected')
		setStatus('second-selected-by-self')
		current_state.opts.value = current
		$parent.notify($parent.make({ to: $parent.address, type: 'value-second', data: { body: [current_state.opts.year, current_state.opts.month+1, current_state.opts.value] } }))
	}

	function setStatus( nextStatus ) {
		console.log('setStatus', JSON.stringify({ type: 'status', name,  data: { body: nextStatus } }, 0, 2))
		current_state.opts.status = nextStatus
		$parent.notify($parent.make({ to: $parent.address, type: 'status', data: { status: nextStatus } }))
	}

	function update_cal(data) {
		const { pos } = data
		let date = setMonth(new Date(), pos)
		current_state.opts.year = getYear(date)
		current_state.opts.days = getDaysInMonth(date)
		current_state.opts.month = getMonth(date)
		adjust_cal_to_month()
	}

	function markRange (A,B) {
		console.log('mark range', {A, B, days: current_state.opts.days})
		if (A === B) return
		if (A < B) colorRange(A, B)
		else colorRange(B, A)
	}

	function colorRange (start, end) {
		const len = Object.keys(buttons).length + 1
		for (var i = 1; i < len; i++) {
			const btn = buttons[i]
			// let current = parseInt(btn.dataset.num)
			if (!btn || btn.classList.value.includes('disabled-day')) continue
			btn.classList.remove('date-in-range')
			if (i < start || i > end) {
				btn.classList.remove('date-selected')
			}
			if (i > start && i < end) {
				console.log('adding date-in-range class for', {i})
				btn.classList.add('date-in-range')
			}
		}
	}
		
	function notifyOther () { $parent.notify($parent.make({ to: $parent.address, type: 'selecting-second' })) }

	function adjust_cal_to_month () {
		for (let i = 1; i < Object.keys(buttons).length + 1; i++) {
			const btn = buttons[i]
			const attributes = [...btn.attributes]
			attributes.forEach(attr => {
				if (attr.name === 'tabIndex' || attr.name === 'data-num') return
				btn.removeAttribute(attr.name)
			})
			const { year, month } = current_state.opts
			let formatDate = format(new Date(year, month, i), 'd MMMM yyyy, EEEE')
			btn.setAttribute('aria-label', formatDate)
			btn.classList.add('day')
			if (i > current_state.opts.days) {
				btn.style.visibility = "hidden"
				continue
			}
			if (btn.style.visibility === "hidden") btn.style.visibility = 'visible'
			if (isToday(new Date(year, month, i)) ) {
				btn.classList.add('today')
				btn.setAttribute('aria-today', true)
			} else { 
				if (isPast(new Date(year, month, i))) btn.classList.add('disabled-day')
				btn.setAttribute('aria-today', false)
			}
		}
	}

	function make_calendar () {
		const days = 31
		const calendar = document.createElement('section')
		calendar.classList.add('calendar-days')
		getSpaceInPrevMonth(calendar)
		const buttons = {}
		const { year, month } = current_state.opts
		for (let i = 1; i < days + 1; i++) {
			let formatDate = format(new Date(year, month, i), 'd MMMM yyyy, EEEE')
			const btn_name = `button-${id++}`
			let btn = button({ name: 'buton', text: i}, contacts.add(btn_name))
			btn.setAttribute('tabIndex', '-1')
			btn.setAttribute('aria-label', formatDate)
			btn.setAttribute('data-num', `${i}`)
			buttons[i] = btn
			contacts.by_name[btn_name].pos = i
			calendar.append(btn)
		}
		return { calendar, buttons }
	}

	function getSpaceInPrevMonth (el) {
		const { year, month } = current_state.opts
		let daysInPrevMonth = getDaysInMonth(new Date(year, month-1))
		// get day in prev month which means to add how many spans
		let dayInPrevMonth = getDay(new Date(year, month-1, daysInPrevMonth))
		for (let s = dayInPrevMonth; s > 0; s--) {
				let span = document.createElement('div')
				span.classList.add('day-prev')
				el.append((span))
		}
	}
}

function init_date () {
	const date = new Date()
	let year = getYear(date)
	let month = getMonth(date)
	let days = getDaysInMonth(date)
	return { year, month, days }
}

function get_theme () {
	return `
	.calendar-days {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: repeat(7, minmax(30px, auto));
    justify-items: center;
}
button {
    background: none;
    border: none;
    cursor: pointer;
}
.day {
    display: grid;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    cursor: pointer;
    transition: color 0.25s, background-color 0.25s ease-in-out;
}
.day:hover {
    color: #fff;
    background-color: #000;
}
.today {
    background-color: #f2f2f2;
}
.date-selected, .date-selected:hover {
    color: #fff;
    background-color: #000;
}
.day-prev {}
.disabled-day, .disabled-day:hover {
    color: #BBBBBB;
    background: none;
    cursor: default;
}
.date-in-range {
    color: #000;
    background-color: #EAEAEA;
}
`
}