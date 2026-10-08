/**
 * Progressive enhancement for a radio group that renders as a pill group on
 * desktop and as a dropdown on small screens. The native radios stay the
 * source of truth, so keyboard and screen reader behaviour comes for free.
 */
export class SelectMenu {
  #root;
  #trigger;
  #radios;

  constructor(root, { onChange }) {
    this.#root = root;
    this.#trigger = root.querySelector('.select__trigger');
    this.#radios = [...root.querySelectorAll('input[type="radio"]')];

    this.#radios.forEach((radio) =>
      radio.addEventListener('change', () => {
        this.#syncTrigger();
        this.close();
        onChange(radio.value);
      }),
    );

    this.#trigger.addEventListener('click', () => this.#toggle());

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) this.close();
    });

    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && root.classList.contains('is-open')) {
        this.close();
        this.#trigger.focus();
      }
    });
  }

  get value() {
    return this.#radios.find((radio) => radio.checked)?.value;
  }

  set value(next) {
    this.#radios.forEach((radio) => {
      radio.checked = radio.value === next;
    });
    this.#syncTrigger();
  }

  close() {
    this.#root.classList.remove('is-open');
    this.#trigger.setAttribute('aria-expanded', 'false');
  }

  #toggle() {
    const isOpen = this.#root.classList.toggle('is-open');
    this.#trigger.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) this.#radios.find((radio) => radio.checked)?.focus();
  }

  #syncTrigger() {
    const checked = this.#radios.find((radio) => radio.checked);
    this.#trigger.textContent = checked?.nextElementSibling.textContent ?? '';
  }
}
