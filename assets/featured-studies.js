(() => {
  const picker = document.querySelector('.study-picker');
  const choices = Array.from(picker.querySelectorAll('button'));
  const panels = choices.map(button => document.getElementById(button.getAttribute('aria-controls')));

  function activate(index) {
    choices.forEach((choice, i) => {
      const selected = i === index;
      choice.setAttribute('aria-selected', String(selected));
      choice.tabIndex = selected ? 0 : -1;
      panels[i].hidden = !selected;
    });
  }

  picker.setAttribute('role', 'tablist');
  choices.forEach((choice, i) => {
    choice.setAttribute('role', 'tab');
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', choice.id);
    choice.addEventListener('click', () => activate(i));
    choice.addEventListener('keydown', event => {
      let index;
      switch (event.key) {
        case 'ArrowRight': index = (i + 1) % choices.length; break;
        case 'ArrowLeft': index = (i + choices.length - 1) % choices.length; break;
        case 'Home': index = 0; break;
        case 'End': index = choices.length - 1; break;
        default: return;
      }
      event.preventDefault();
      activate(index);
      choices[index].focus();
    });
  });
  activate(0);
  picker.hidden = false;
})();
