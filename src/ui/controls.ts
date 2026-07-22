import type { DerivedLayout, ModelConfig } from '../model/config';
import { configToUrl, deriveLayout, formatInches } from '../model/config';

export type ViewPreset = 'hero' | 'front' | 'plan' | 'left-detail' | 'right-detail' | 'fireplace';

export interface AppShell {
  viewport: HTMLElement;
  canvasHost: HTMLElement;
  overlayHost: HTMLElement;
  panel: HTMLElement;
  partInspector: HTMLElement;
  warningPanel: HTMLElement;
  statusText: HTMLElement;
  fpsText: HTMLElement;
  desktopBlocker: HTMLElement;
}

export interface ControlCallbacks {
  onConfigChange: (next: ModelConfig) => void;
  onViewPreset: (preset: ViewPreset) => void;
  onReset: () => void;
  onFitBookcases: () => void;
  onSaveImage: () => void;
  onCopyLink: () => void;
}

interface FieldDefinition {
  key: keyof ModelConfig;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  help?: string;
  type?: 'number' | 'select' | 'checkbox';
  options?: Array<{ value: string | number; label: string }>;
}

export interface ControlPanelApi {
  shell: AppShell;
  sync: (config: ModelConfig, derived: DerivedLayout) => void;
  setActiveView: (preset: ViewPreset | null) => void;
  setPart: (part: PartDisplay | null) => void;
  setStatus: (message: string) => void;
  setFps: (fps: number) => void;
}

export interface PartDisplay {
  name: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  material?: string;
  note?: string;
}

export function createAppUi(
  root: HTMLElement,
  initialConfig: ModelConfig,
  callbacks: ControlCallbacks,
): ControlPanelApi {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-block">
          <div class="brand-mark" aria-hidden="true"><span></span><span></span><i></i></div>
          <div>
            <div class="eyebrow">Parametric millwork model</div>
            <h1>Fireplace Bookcases</h1>
          </div>
        </div>
        <nav class="view-presets" aria-label="Camera views">
          <button data-view="hero" class="active" aria-pressed="true">Perspective</button>
          <button data-view="front" aria-pressed="false">Front</button>
          <button data-view="plan" aria-pressed="false">Plan</button>
          <button data-view="left-detail" aria-pressed="false">Left detail</button>
          <button data-view="right-detail" aria-pressed="false">Right detail</button>
          <button data-view="fireplace" aria-pressed="false">Fireplace</button>
        </nav>
        <div class="top-actions">
          <button id="copy-link" class="quiet-button" title="Copy a shareable URL with the current dimensions">Copy link</button>
          <button id="save-image" class="primary-button">Save PNG</button>
        </div>
      </header>

      <aside class="control-panel" aria-label="Model dimensions and options">
        <div class="panel-heading">
          <div>
            <div class="eyebrow">Desktop configurator</div>
            <h2>Dimensions</h2>
          </div>
          <button id="reset-model" class="icon-button" title="Reset all dimensions" aria-label="Reset all dimensions">↺</button>
        </div>
        <div id="controls-scroll" class="controls-scroll"></div>
      </aside>

      <main id="viewport" class="viewport">
        <div id="canvas-host" class="canvas-host"></div>
        <div id="overlay-host" class="overlay-host"></div>
        <div class="viewport-vignette" aria-hidden="true"></div>
        <div class="viewport-help">
          <span><b>Orbit</b> left-drag</span>
          <span><b>Pan</b> right-drag</span>
          <span><b>Zoom</b> wheel</span>
          <span><b>Inspect</b> click a part</span>
        </div>
        <div id="part-inspector" class="part-inspector is-empty">
          <div class="part-kicker">Selected part</div>
          <strong>Select any cabinet component</strong>
          <p>Dimensions, material, and construction notes will appear here.</p>
        </div>
        <div id="warning-panel" class="warning-panel" hidden></div>
        <div class="viewer-status">
          <span id="status-text">Building detailed model…</span>
          <span id="fps-text"></span>
        </div>
      </main>

      <div id="desktop-blocker" class="desktop-blocker">
        <div>
          <strong>Desktop model only</strong>
          <p>This project is intentionally designed for a wide desktop workspace, not a mobile layout.</p>
        </div>
      </div>
    </div>
  `;

  const viewport = required<HTMLElement>(root, '#viewport');
  const shell: AppShell = {
    viewport,
    canvasHost: required(root, '#canvas-host'),
    overlayHost: required(root, '#overlay-host'),
    panel: required(root, '.control-panel'),
    partInspector: required(root, '#part-inspector'),
    warningPanel: required(root, '#warning-panel'),
    statusText: required(root, '#status-text'),
    fpsText: required(root, '#fps-text'),
    desktopBlocker: required(root, '#desktop-blocker'),
  };

  const controlsScroll = required(root, '#controls-scroll');
  const inputMap = new Map<keyof ModelConfig, HTMLInputElement | HTMLSelectElement>();
  let currentConfig = { ...initialConfig };

  const derivedReadout = document.createElement('div');
  derivedReadout.className = 'derived-readout';
  derivedReadout.setAttribute('aria-live', 'polite');
  derivedReadout.innerHTML = `
    <div class="derived-readout-heading">
      <strong>Automatic shelf sizing</strong>
      <small>Calculated from each clear bay span</small>
    </div>
    <div class="derived-readout-grid">
      <div>
        <span>Left clear span</span>
        <strong data-derived="left-span">—</strong>
        <small data-derived="left-shelf">Shelf —</small>
      </div>
      <div>
        <span>Right clear span</span>
        <strong data-derived="right-span">—</strong>
        <small data-derived="right-shelf">Shelf —</small>
      </div>
    </div>
  `;

  const groups: Array<{ title: string; subtitle?: string; fields: FieldDefinition[]; advanced?: boolean }> = [
    {
      title: 'Room layout',
      subtitle: 'U-shaped room and central chimney projection',
      fields: [
        numberField('roomWidth', 'Room width', 150, 360, 0.25),
        numberField('roomDepth', 'Room depth', 96, 300, 0.25),
        numberField('roomHeight', 'Ceiling height', 84, 168, 0.25),
        numberField('chimneyWidth', 'Chimney width', 42, 96, 0.25),
        numberField('chimneyDepth', 'Chimney projection', 3, 24, 0.25),
      ],
    },
    {
      title: 'Bookcases',
      subtitle: 'Overall dimensions change; construction thicknesses stay independent',
      fields: [
        numberField('leftBookcaseWidth', 'Left overall width', 44, 108, 0.125),
        numberField('rightBookcaseWidth', 'Right overall width', 44, 108, 0.125),
        numberField('bookcaseHeight', 'Overall height', 72, 156, 0.125),
        numberField('upperDepth', 'Upper depth', 10, 22, 0.125),
        numberField('baseDepth', 'Base depth', 16, 30, 0.125),
        numberField('baseHeight', 'Base cabinet height', 24, 42, 0.125),
        numberField('shelfCount', 'Shelves per bay', 2, 8, 1, ''),
      ],
    },
    {
      title: 'Fireplace & mantel',
      subtitle: 'Classical mantel from the drawing on the layout chimney breast',
      fields: [
        numberField('fireplaceOpeningWidth', 'Firebox opening width', 24, 60, 0.125),
        numberField('fireplaceOpeningHeight', 'Firebox opening height', 18, 42, 0.125),
        numberField('mantelWidth', 'Mantel width', 42, 84, 0.125),
        numberField('mantelHeight', 'Mantel height', 34, 62, 0.125),
        numberField('mantelDepth', 'Mantel depth', 6, 18, 0.125),
        numberField('hearthWidth', 'Hearth width', 42, 96, 0.125),
        numberField('hearthDepth', 'Hearth projection', 10, 30, 0.125),
      ],
    },
    {
      title: 'Installation details',
      subtitle: 'Field-fit dimensions; drawing construction values remain fixed',
      advanced: true,
      fields: [
        numberField('sideFiller', 'Side filler / scribe', 0.75, 8, 0.125),
        numberField('crownHeight', 'Crown height', 1.5, 8, 0.125),
        numberField('crownProjection', 'Crown projection', 0.5, 4, 0.125),
        numberField('toeKickHeight', 'Toe-kick height', 2.5, 6, 0.125),
        numberField('toeKickRecess', 'Toe-kick recess', 1, 5, 0.125),
        numberField('centerGap', 'Gap at chimney', 0, 8, 0.125),
      ],
    },
    {
      title: 'Finish & visibility',
      fields: [
        selectField('cabinetFinish', 'Cabinet finish', [
          { value: 'warm-white', label: 'Warm white' },
          { value: 'pure-white', label: 'Pure white' },
          { value: 'soft-gray', label: 'Soft gray' },
          { value: 'deep-green', label: 'Deep green' },
        ]),
        selectField('floorFinish', 'Floor finish', [
          { value: 'natural-oak', label: 'Natural oak' },
          { value: 'white-oak', label: 'White oak' },
          { value: 'walnut', label: 'Walnut' },
        ]),
        checkboxField('showDimensions', 'Show 3D dimensions'),
        checkboxField('showPinHoles', 'Show 5 mm pin holes'),
        checkboxField('showHardware', 'Show cabinet hardware'),
        checkboxField('showFire', 'Animate electric fire'),
        checkboxField('showRoom', 'Show room shell'),
        checkboxField('showCeiling', 'Show ceiling'),
      ],
    },
  ];

  for (const groupDefinition of groups) {
    const section = document.createElement(groupDefinition.advanced ? 'details' : 'section');
    section.className = groupDefinition.advanced ? 'control-group advanced-group' : 'control-group';
    if (groupDefinition.advanced) {
      const summary = document.createElement('summary');
      summary.innerHTML = `<span><strong>${groupDefinition.title}</strong><small>${groupDefinition.subtitle ?? ''}</small></span><i>+</i>`;
      section.appendChild(summary);
    } else {
      const heading = document.createElement('div');
      heading.className = 'control-group-heading';
      heading.innerHTML = `<h3>${groupDefinition.title}</h3>${groupDefinition.subtitle ? `<p>${groupDefinition.subtitle}</p>` : ''}`;
      section.appendChild(heading);
    }

    const fields = document.createElement('div');
    fields.className = 'field-stack';
    for (const definition of groupDefinition.fields) {
      const row = createField(definition, currentConfig, (key, rawValue) => {
        const next = { ...currentConfig };
        const current = next[key];
        if (typeof current === 'number') {
          (next[key] as number) = Number(rawValue);
        } else if (typeof current === 'boolean') {
          (next[key] as boolean) = Boolean(rawValue);
        } else {
          (next[key] as string) = String(rawValue);
        }
        currentConfig = next;
        callbacks.onConfigChange(next);
      });
      inputMap.set(definition.key, row.input);
      fields.appendChild(row.element);
    }
    section.appendChild(fields);
    controlsScroll.appendChild(section);
    if (groupDefinition.title === 'Bookcases') controlsScroll.appendChild(derivedReadout);
  }

  const fitCard = document.createElement('div');
  fitCard.className = 'logic-card';
  fitCard.innerHTML = `
    <div>
      <strong>Fit bookcases to wall</strong>
      <p>Calculates symmetrical unit widths from the room and chimney without changing shelf, face-frame, or case thickness.</p>
    </div>
    <button id="fit-bookcases" class="quiet-button">Fit</button>
  `;
  controlsScroll.appendChild(fitCard);

  const drawingCard = document.createElement('a');
  drawingCard.className = 'reference-card';
  const baseUrl = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
  const drawingUrl = `${baseUrl}reference/bookcase-detail-drawing.png`;
  drawingCard.href = drawingUrl;
  drawingCard.target = '_blank';
  drawingCard.rel = 'noreferrer';
  drawingCard.innerHTML = `
    <span class="reference-thumb drawing-thumb" aria-hidden="true"></span>
    <span><strong>Reference drawing</strong><small>Open the supplied millwork detail</small></span>
    <i>↗</i>
  `;
  required<HTMLElement>(drawingCard, '.drawing-thumb').style.backgroundImage = `url("${drawingUrl}")`;
  controlsScroll.appendChild(drawingCard);

  required<HTMLButtonElement>(root, '#reset-model').addEventListener('click', callbacks.onReset);
  required<HTMLButtonElement>(root, '#fit-bookcases').addEventListener('click', callbacks.onFitBookcases);
  required<HTMLButtonElement>(root, '#save-image').addEventListener('click', callbacks.onSaveImage);
  required<HTMLButtonElement>(root, '#copy-link').addEventListener('click', callbacks.onCopyLink);

  const setActiveView = (preset: ViewPreset | null): void => {
    root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
      const active = button.dataset.view === preset;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = button.dataset.view as ViewPreset;
      setActiveView(preset);
      callbacks.onViewPreset(preset);
    });
  });

  const sync = (config: ModelConfig, derived: DerivedLayout): void => {
    currentConfig = { ...config };
    for (const [key, input] of inputMap) {
      const value = config[key];
      if (input instanceof HTMLInputElement && input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else {
        input.value = String(value);
      }
    }
    updateWarnings(shell.warningPanel, derived);
    updateDerivedReadout(derivedReadout, derived);
  };

  const setPart = (part: PartDisplay | null): void => {
    if (!part) {
      shell.partInspector.classList.add('is-empty');
      shell.partInspector.innerHTML = `
        <div class="part-kicker">Selected part</div>
        <strong>Select any cabinet component</strong>
        <p>Dimensions, material, and construction notes will appear here.</p>
      `;
      return;
    }
    shell.partInspector.classList.remove('is-empty');
    shell.partInspector.innerHTML = `
      <div class="part-kicker">${escapeHtml(part.category)}</div>
      <strong>${escapeHtml(part.name)}</strong>
      <div class="part-dimensions">
        <span><b>W</b>${formatInches(part.width)}</span>
        <span><b>H</b>${formatInches(part.height)}</span>
        <span><b>D</b>${formatInches(part.depth)}</span>
      </div>
      ${part.material ? `<p><b>Material:</b> ${escapeHtml(part.material)}</p>` : ''}
      ${part.note ? `<p>${escapeHtml(part.note)}</p>` : ''}
    `;
  };

  sync(initialConfig, deriveLayout(initialConfig));

  return {
    shell,
    sync,
    setActiveView,
    setPart,
    setStatus: (message) => {
      shell.statusText.textContent = message;
    },
    setFps: (fps) => {
      shell.fpsText.textContent = fps > 0 ? `${Math.round(fps)} fps` : '';
    },
  };
}

function createField(
  definition: FieldDefinition,
  config: ModelConfig,
  onChange: (key: keyof ModelConfig, value: string | number | boolean) => void,
): { element: HTMLElement; input: HTMLInputElement | HTMLSelectElement } {
  const row = document.createElement('label');
  row.className = definition.type === 'checkbox' ? 'field-row checkbox-row' : 'field-row';
  const label = document.createElement('span');
  label.className = 'field-label';
  label.innerHTML = `<span>${definition.label}</span>${definition.help ? `<small>${definition.help}</small>` : ''}`;
  row.appendChild(label);

  let input: HTMLInputElement | HTMLSelectElement;
  if (definition.type === 'select') {
    const select = document.createElement('select');
    for (const option of definition.options ?? []) {
      const element = document.createElement('option');
      element.value = String(option.value);
      element.textContent = option.label;
      select.appendChild(element);
    }
    select.value = String(config[definition.key]);
    select.addEventListener('change', () => {
      const current = config[definition.key];
      onChange(definition.key, typeof current === 'number' ? Number(select.value) : select.value);
    });
    input = select;
    row.appendChild(select);
  } else if (definition.type === 'checkbox') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = Boolean(config[definition.key]);
    checkbox.addEventListener('change', () => onChange(definition.key, checkbox.checked));
    const track = document.createElement('span');
    track.className = 'switch-track';
    track.appendChild(document.createElement('i'));
    row.append(checkbox, track);
    input = checkbox;
  } else {
    const inputWrap = document.createElement('span');
    inputWrap.className = 'number-input-wrap';
    const numberInput = document.createElement('input');
    numberInput.type = 'number';
    numberInput.min = String(definition.min ?? '');
    numberInput.max = String(definition.max ?? '');
    numberInput.step = String(definition.step ?? 0.125);
    numberInput.value = String(config[definition.key]);
    numberInput.addEventListener('input', () => {
      const value = numberInput.valueAsNumber;
      if (Number.isFinite(value)) onChange(definition.key, value);
    });
    numberInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') numberInput.blur();
    });
    inputWrap.appendChild(numberInput);
    const suffix = document.createElement('span');
    suffix.className = 'input-suffix';
    suffix.textContent = definition.suffix ?? 'in';
    inputWrap.appendChild(suffix);
    row.appendChild(inputWrap);
    input = numberInput;
  }
  return { element: row, input };
}

function numberField(
  key: keyof ModelConfig,
  label: string,
  min: number,
  max: number,
  step: number,
  suffix = 'in',
): FieldDefinition {
  return { key, label, min, max, step, suffix, type: 'number' };
}

function selectField(
  key: keyof ModelConfig,
  label: string,
  options: FieldDefinition['options'],
): FieldDefinition {
  return { key, label, options, type: 'select' };
}

function checkboxField(key: keyof ModelConfig, label: string): FieldDefinition {
  return { key, label, type: 'checkbox' };
}

function updateWarnings(panel: HTMLElement, derived: DerivedLayout): void {
  if (derived.structuralWarnings.length === 0) {
    panel.hidden = true;
    panel.innerHTML = '';
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <strong>Design check</strong>
    ${derived.structuralWarnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join('')}
    <small>Visual model only — final engineering and field verification remain required.</small>
  `;
}

function updateDerivedReadout(
  readout: HTMLElement,
  derived: DerivedLayout,
): void {
  required<HTMLElement>(readout, '[data-derived="left-span"]').textContent = formatInches(derived.leftBayWidth);
  required<HTMLElement>(readout, '[data-derived="right-span"]').textContent = formatInches(derived.rightBayWidth);
  required<HTMLElement>(readout, '[data-derived="left-shelf"]').textContent = formatShelfValue(
    derived.leftAdjustableShelfThickness,
    derived.leftShelfSupportRequired,
  );
  required<HTMLElement>(readout, '[data-derived="right-shelf"]').textContent = formatShelfValue(
    derived.rightAdjustableShelfThickness,
    derived.rightShelfSupportRequired,
  );
}

function formatShelfValue(value: number, supportRequired: boolean): string {
  return `Shelf ${formatInches(value)}${supportRequired ? ' · support required' : ''}`;
}

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function copyShareUrl(config: ModelConfig): Promise<void> {
  const shareUrl = configToUrl(config);
  try {
    await navigator.clipboard.writeText(shareUrl);
    return;
  } catch {
    const field = document.createElement('textarea');
    field.value = shareUrl;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Clipboard access is unavailable.');
  }
}
