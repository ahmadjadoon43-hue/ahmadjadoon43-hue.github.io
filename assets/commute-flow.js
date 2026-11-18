(() => {
  'use strict';

  const canvas = document.getElementById('commute-flow');
  const origin = document.getElementById('flow-origin');
  const readout = document.getElementById('flow-readout');
  const table = document.querySelector('.commute-figure table');
  const rows = Array.from(table.tBodies[0].rows);
  const values = rows.map(row => Array.from(row.cells).slice(1).map(cell => Number(cell.textContent)));
  const sum = numbers => numbers.reduce((total, value) => total + value, 0);
  const origins = values.map(sum);
  const destinations = values[0].map((_, column) => sum(values.map(row => row[column])));
  const total = sum(origins);
  const palette = ['#a1d3af', '#f0bf79', '#86bbdb', '#d9adbd', '#a1c4a1', '#d1dca0', '#aaabd6', '#e4a78a'];
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    table.closest('details').open = true;
    origin.disabled = true;
    return;
  }

  function accumulate(heights, gap) {
    let y = 7;
    return heights.map(height => {
      const start = y;
      y += height + gap;
      return start;
    });
  }

  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const gap = 12;
    const unit = (height - 14 - gap * (values.length - 1)) / total;
    const left = 20;
    const right = width - 20;
    const handle = (right - left) * 0.46;
    const leftY = accumulate(origins.map(value => value * unit), gap);
    const rightY = accumulate(destinations.map(value => value * unit), gap);
    const flows = [];
    const ends = rightY.slice();

    values.forEach((row, i) => {
      let start = leftY[i];
      row.forEach((count, j) => {
        const thickness = count * unit;
        flows.push({i, start, end: ends[j], thickness});
        start += thickness;
        ends[j] += thickness;
      });
    });

    const active = origin.value === 'all' ? null : Number(origin.value);
    // Paint the selected origin last so its narrowest ribbons remain visible.
    if (active !== null) flows.sort((a, b) => Number(a.i === active) - Number(b.i === active));
    for (const {i, start, end, thickness} of flows) {
      ctx.globalAlpha = active === null ? 0.57 : i === active ? 0.95 : 0.10;
      ctx.fillStyle = palette[i];
      ctx.beginPath();
      ctx.moveTo(left, start);
      ctx.bezierCurveTo(left + handle, start, right - handle, end, right, end);
      ctx.lineTo(right, end + thickness);
      ctx.bezierCurveTo(right - handle, end + thickness, left + handle, start + thickness, left, start + thickness);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    leftY.forEach((top, i) => {
      ctx.fillStyle = palette[i];
      ctx.fillRect(left - 3, top, 3, origins[i] * unit);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#e6f3e7';
      ctx.fillText(String(i + 1), 0, top + origins[i] * unit / 2);
    });
    rightY.forEach((top, j) => {
      ctx.fillStyle = '#b3c6b9';
      ctx.fillRect(right, top, 3, destinations[j] * unit);
      ctx.textAlign = 'right';
      ctx.fillText(String(j + 1), width, top + destinations[j] * unit / 2);
    });
  }

  function update() {
    const all = origin.value === 'all';
    const selected = all ? null : Number(origin.value);
    const count = all ? total : origins[selected];
    const number = document.createElement('strong');
    number.textContent = count.toLocaleString('en-US');
    const label = all ? 'internal job connections' : 'connections from zone ' + (selected + 1);
    readout.replaceChildren(number, document.createTextNode(label));
    canvas.setAttribute('aria-label', all
      ? 'Home-to-work flows for all eight zones. Ribbon widths represent numbers of primary jobs. See the data table for exact counts.'
      : 'Showing ' + count + ' primary-job connections from home zone ' + (selected + 1) + ' to the eight work zones. See the data table for exact counts.');
    rows.forEach((row, index) => row.classList.toggle('selected-origin', selected === index));
    draw();
  }

  origin.addEventListener('change', update);
  new ResizeObserver(draw).observe(canvas);
  update();
})();
