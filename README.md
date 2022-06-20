# datdot-ui-calendar-days
DatDot vanilla js UI component

Opts
---

`{name = 'calendar-days', month, days, year, status, value, start_cal, theme = ``}`

Help
---
`calendar_days.help()` returns opts & the defaults for calendar-days component


Incoming message types
---

- `clear` returns clear_self()
- `selecting-second` returns colorRange(0, current_state.opts.value)
- `first-selected-by-startcal` returns setStatus('first-selected-by-startcal`
- `first-selected-by-endcal` returns setStatus('first-selected-by-endcal`
- `second-selected` returns setStatus('second-selected-by-other`
- `color-from-start` returns colorRange(0, current_state.opts.value)
- `color-to-end` returns colorRange(current_state.opts.value, days + 1)
- `change` returns render_new_cal(data)
- `color-range-from-start`


Outgoing message types
---

**parent**
- `help` sends info on current state
- `clear`
- `value-first`
- `value-second`
- `status`
- `selecting-second`
