(() => {
  'use strict';
  const compare = document.querySelector('.map-compare');
  const slider = compare.querySelector('.compare-input');
  const help = document.getElementById('compare-help');

  function setSplit() {
    const percent = Number(slider.value);
    compare.style.setProperty('--split', percent + '%');
    compare.classList.toggle('map-only', percent < 18);
    compare.classList.toggle('aerial-only', percent > 78);
    slider.setAttribute('aria-valuetext', percent + '% aerial, ' + (100 - percent) + '% mapped roads');
  }

  slider.hidden = false;
  help.textContent = 'Drag the divider or use the left and right keys.';
  slider.addEventListener('input', setSplit);
  setSplit();

  const picker = document.querySelector('.study-picker');
  const choices = Array.from(picker.querySelectorAll('button'));
  const panels = choices.map(button => document.getElementById(button.getAttribute('aria-controls')));
  const pager = document.querySelector('.study-pager');
  let current = 0;

  function activate(index) {
    current = (index + choices.length) % choices.length;
    choices.forEach((choice, i) => {
      const selected = i === current;
      choice.setAttribute('aria-selected', String(selected));
      choice.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
    pager.querySelector('output').textContent = (current + 1) + ' / ' + choices.length;
  }

  picker.setAttribute('role', 'tablist');
  choices.forEach((choice, i) => {
    choice.setAttribute('role', 'tab');
    const panel = panels[i];
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', choice.id);
    choice.addEventListener('click', () => activate(i));
    choice.addEventListener('keydown', event => {
      let index;
      switch (event.key) {
        case 'ArrowRight': index = i + 1; break;
        case 'ArrowLeft': index = i - 1; break;
        case 'Home': index = 0; break;
        case 'End': index = choices.length - 1; break;
        default: return;
      }
      event.preventDefault();
      activate(index);
      choices[current].focus();
    });
  });
  pager.querySelectorAll('[data-move]').forEach(button => {
    button.addEventListener('click', () => activate(current + Number(button.dataset.move)));
  });
  activate(0);
  picker.hidden = false;
  pager.hidden = false;
})();
