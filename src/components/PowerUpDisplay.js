let displayElement = null;
// What is currently written on the page, so it is only rewritten when it changes
let displayedText = '';

// A row under the score that lists the power-ups Tode has right now
export function createPowerUpDisplay() {
  displayElement = document.createElement('div');
  displayElement.className = 'power-ups';
  document.body.appendChild(displayElement);

  return displayElement;
}

// `powerUps` is the list from `getActivePowerUps`
export function updatePowerUpDisplay(powerUps) {
  // Timed power-ups show the seconds left; the shield has no timer
  const labels = powerUps.map(({ label, remaining }) =>
    Number.isFinite(remaining) ? `${label} ${Math.ceil(remaining)}s` : label
  );

  const text = labels.join('|');
  if (text === displayedText) return;
  displayedText = text;

  displayElement.replaceChildren(
    ...powerUps.map(({ color }, index) => {
      const item = document.createElement('span');
      item.className = 'power-up';
      item.textContent = labels[index];
      item.style.backgroundColor = `#${color.toString(16).padStart(6, '0')}`;
      return item;
    })
  );
}
