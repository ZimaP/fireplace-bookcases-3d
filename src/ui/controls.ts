import type { DerivedLayout, ModelConfig, RoomLayoutId } from '../model/config';
import {
  applyRoomLayoutPreset,
  configToUrl,
  deriveLayout,
  formatInches,
  getLayoutDimensionKeys,
  getPlacementOptions,
  getRoomLayoutOption,
  ROOM_LAYOUT_OPTIONS,
} from '../model/config';

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
  onFitPlacement: () => void;
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

interface FieldGroupDefinition {
  id: string;
  title: string;
  subtitle?: string;
  fields: FieldDefinition[];
  advanced?: boolean;
  className?: string;
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

const LAYOUT_CATEGORIES = [
  { value: 'feature-walls', label: 'Feature walls', description: 'Rooms organized around a fireplace or media focal point.' },
  { value: 'simple-walls', label: 'Simple walls', description: 'Open walls, doors, and common furniture-planning conditions.' },
  { value: 'window-walls', label: 'Window walls', description: 'Single, offset, and paired window arrangements.' },
  { value: 'recesses', label: 'Recesses & nooks', description: 'Built-ins fitted into niches, alcoves, and side returns.' },
] as const;

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
            <div class="eyebrow">Bookcase planning studio</div>
            <h1>Bookcase Room Studio</h1>
          </div>
        </div>
        <nav class="view-presets" aria-label="Camera views">
          <button type="button" data-view="hero" class="active" aria-pressed="true">Perspective</button>
          <button type="button" data-view="front" aria-pressed="false">Front</button>
          <button type="button" data-view="plan" aria-pressed="false">Plan</button>
          <button type="button" data-view="left-detail" aria-pressed="false">Left detail</button>
          <button type="button" data-view="right-detail" aria-pressed="false">Right detail</button>
          <button type="button" data-view="fireplace" aria-pressed="false">Fireplace</button>
        </nav>
        <div class="top-actions">
          <button type="button" id="copy-link" class="quiet-button" title="Copy a shareable URL with the current dimensions">Copy link</button>
          <button type="button" id="save-image" class="primary-button">Save PNG</button>
        </div>
      </header>

      <aside class="control-panel" aria-label="Room and bookcase configurator">
        <div class="panel-heading">
          <div>
            <div class="eyebrow">Desktop configurator</div>
            <h2>Configure your room</h2>
          </div>
          <button type="button" id="reset-model" class="icon-button" title="Start over with default dimensions" aria-label="Reset room and bookcase">↺</button>
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

      <dialog id="layout-catalog" class="layout-catalog" aria-labelledby="layout-catalog-title">
        <div class="catalog-dialog-shell">
          <header class="catalog-dialog-header">
            <div>
              <div class="eyebrow">10 common room scenarios</div>
              <h2 id="layout-catalog-title">Which room looks most like yours?</h2>
              <p>Choose the closest starting point. Every measurement can be refined after placement.</p>
            </div>
            <button type="button" class="catalog-close icon-button" aria-label="Close layout catalog">×</button>
          </header>
          <div class="catalog-scroll" data-catalog-groups></div>
        </div>
      </dialog>
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

  const controlsScroll = required<HTMLElement>(root, '#controls-scroll');
  const catalogDialog = required<HTMLDialogElement>(root, '#layout-catalog');
  const catalogGroups = required<HTMLElement>(catalogDialog, '[data-catalog-groups]');
  const inputMap = new Map<keyof ModelConfig, HTMLInputElement | HTMLSelectElement>();
  let currentConfig = { ...initialConfig };
  let catalogOpener: HTMLElement | null = null;

  const selectedLayoutCard = document.createElement('button');
  selectedLayoutCard.type = 'button';
  selectedLayoutCard.className = 'selected-layout-card';
  selectedLayoutCard.setAttribute('aria-haspopup', 'dialog');
  selectedLayoutCard.setAttribute('aria-controls', 'layout-catalog');

  const layoutStep = document.createElement('section');
  layoutStep.className = 'workflow-step layout-step';
  layoutStep.innerHTML = stepHeading('1', 'Choose your room layout', 'Pick the closest match; exact dimensions come next.');
  layoutStep.appendChild(selectedLayoutCard);
  const browseLayouts = document.createElement('button');
  browseLayouts.type = 'button';
  browseLayouts.className = 'browse-layouts-button quiet-button';
  browseLayouts.textContent = `Browse ${ROOM_LAYOUT_OPTIONS.length} layouts`;
  browseLayouts.setAttribute('aria-haspopup', 'dialog');
  browseLayouts.setAttribute('aria-controls', 'layout-catalog');
  layoutStep.appendChild(browseLayouts);
  controlsScroll.appendChild(layoutStep);

  const placementStep = document.createElement('section');
  placementStep.className = 'workflow-step placement-step';
  placementStep.innerHTML = stepHeading('2', 'Choose the bookcase position', 'Select where the built-in belongs in this room.');
  const placementChoices = document.createElement('div');
  placementChoices.className = 'placement-choices';
  placementChoices.setAttribute('role', 'radiogroup');
  placementChoices.setAttribute('aria-label', 'Bookcase position');
  placementStep.appendChild(placementChoices);
  controlsScroll.appendChild(placementStep);

  const fitCard = document.createElement('section');
  fitCard.className = 'workflow-step fit-step';
  fitCard.innerHTML = `
    <div class="step-heading compact-step-heading">
      <span class="step-number">3</span>
      <div><h3>Place the bookcase</h3><p>Automatically size it to the selected opening.</p></div>
    </div>
    <button type="button" id="fit-placement" class="place-fit-button primary-button">
      <span>Place &amp; fit bookcase</span><i aria-hidden="true">→</i>
    </button>
    <small>Fixed cabinet construction thicknesses never scale.</small>
  `;
  controlsScroll.appendChild(fitCard);

  const openingFields: FieldDefinition[] = [
    numberField('wallOpeningWidth', 'Available wall span', 44, 180, 0.125),
    numberField('windowWidth', 'Window width', 24, 96, 0.125),
    numberField('windowHeight', 'Window height', 24, 72, 0.125),
    numberField('windowSillHeight', 'Window sill height', 18, 60, 0.125),
    numberField('windowCenterX', 'Window offset from center', -48, 48, 0.125),
    numberField('doubleWindowGap', 'Clear gap between casings', 44, 120, 0.125),
    numberField('nicheWidth', 'Niche clear width', 44, 144, 0.125),
    numberField('nicheDepth', 'Niche recess depth', 12, 48, 0.125),
    numberField('alcoveOpeningWidth', 'Alcove clear width', 44, 108, 0.125),
    numberField('alcoveDepth', 'Alcove depth', 48, 240, 0.25),
    numberField('chimneyWidth', 'Chimney width', 42, 96, 0.25),
    numberField('chimneyDepth', 'Chimney projection', 3, 24, 0.25),
    numberField('doorWidth', 'Door opening width', 28, 72, 0.125),
    numberField('doorHeight', 'Door opening height', 72, 96, 0.125),
    numberField('doorCenterX', 'Door offset from center', -48, 48, 0.125),
    numberField('mediaZoneWidth', 'Media zone width', 48, 120, 0.125),
    numberField('mediaZoneHeight', 'Media zone height', 32, 72, 0.125),
    numberField('sideNookWidth', 'Nook clear width', 44, 144, 0.125),
    numberField('sideNookDepth', 'Nook recess depth', 12, 48, 0.125),
  ];

  const appendFieldGroup = (definition: FieldGroupDefinition): HTMLElement => {
    const section = document.createElement(definition.advanced ? 'details' : 'section');
    section.className = definition.advanced ? 'control-group advanced-group' : 'control-group';
    if (definition.className) section.classList.add(definition.className);
    section.dataset.controlGroup = definition.id;
    if (definition.advanced) {
      const summary = document.createElement('summary');
      summary.innerHTML = `<span><strong>${escapeHtml(definition.title)}</strong><small>${escapeHtml(definition.subtitle ?? '')}</small></span><i aria-hidden="true">+</i>`;
      section.appendChild(summary);
    } else {
      const heading = document.createElement('div');
      heading.className = 'control-group-heading';
      heading.innerHTML = `<h3>${escapeHtml(definition.title)}</h3>${definition.subtitle ? `<p>${escapeHtml(definition.subtitle)}</p>` : ''}`;
      section.appendChild(heading);
    }

    const fields = document.createElement('div');
    fields.className = 'field-stack';
    for (const fieldDefinition of definition.fields) {
      const row = createField(fieldDefinition, currentConfig, (key, rawValue) => {
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
      row.element.dataset.fieldKey = String(fieldDefinition.key);
      inputMap.set(fieldDefinition.key, row.input);
      fields.appendChild(row.element);
    }
    section.appendChild(fields);
    controlsScroll.appendChild(section);
    return section;
  };

  appendFieldGroup({
    id: 'opening',
    title: 'Opening measurements',
    subtitle: 'Only measurements relevant to this room are shown',
    fields: openingFields,
    className: 'opening-measurements',
  });

  appendFieldGroup({
    id: 'room-more',
    title: 'More room measurements',
    subtitle: 'Overall room envelope for the 3D view',
    advanced: true,
    fields: [
      numberField('roomWidth', 'Room width', 72, 360, 0.25),
      numberField('roomDepth', 'Room depth', 72, 300, 0.25),
      numberField('roomHeight', 'Ceiling height', 84, 168, 0.25),
    ],
  });

  appendFieldGroup({
    id: 'bookcases',
    title: 'Bookcase dimensions',
    subtitle: 'Adjust the result while drawing-controlled construction stays fixed',
    fields: [
      numberField('leftBookcaseWidth', 'Left overall width', 44, 180, 0.125),
      numberField('rightBookcaseWidth', 'Right overall width', 44, 180, 0.125),
      numberField('bookcaseHeight', 'Overall height', 72, 156, 0.125),
      numberField('upperDepth', 'Upper depth', 10, 22, 0.125),
      numberField('baseDepth', 'Base depth', 16, 30, 0.125),
      numberField('baseHeight', 'Base cabinet height', 24, 42, 0.125),
      numberField('shelfCount', 'Shelves per bay', 2, 8, 1, ''),
    ],
  });

  const derivedReadout = document.createElement('div');
  derivedReadout.className = 'derived-readout';
  derivedReadout.setAttribute('aria-live', 'polite');
  derivedReadout.innerHTML = `
    <div class="derived-readout-heading">
      <strong data-derived="opening-label">Selected opening</strong>
      <small><span data-derived="opening-width">—</span> clear</small>
    </div>
    <div class="derived-readout-grid">
      <div data-derived-unit="0">
        <span data-derived="unit-0-label">Bookcase</span>
        <strong data-derived="unit-0-span">—</strong>
        <small data-derived="unit-0-shelf">Shelf —</small>
      </div>
      <div data-derived-unit="1">
        <span data-derived="unit-1-label">Bookcase</span>
        <strong data-derived="unit-1-span">—</strong>
        <small data-derived="unit-1-shelf">Shelf —</small>
      </div>
    </div>
  `;
  controlsScroll.appendChild(derivedReadout);

  appendFieldGroup({
    id: 'fireplace',
    title: 'Fireplace & mantel',
    subtitle: 'Classical mantel from the supplied millwork elevation',
    fields: [
      numberField('fireplaceOpeningWidth', 'Firebox opening width', 24, 60, 0.125),
      numberField('fireplaceOpeningHeight', 'Firebox opening height', 18, 42, 0.125),
      numberField('mantelWidth', 'Mantel width', 42, 84, 0.125),
      numberField('mantelHeight', 'Mantel height', 34, 62, 0.125),
      numberField('mantelDepth', 'Mantel depth', 6, 18, 0.125),
      numberField('hearthWidth', 'Hearth width', 42, 96, 0.125),
      numberField('hearthDepth', 'Hearth projection', 10, 30, 0.125),
    ],
  });

  appendFieldGroup({
    id: 'installation',
    title: 'Installation details',
    subtitle: 'Field-fit values; fixed cabinet construction is protected',
    advanced: true,
    fields: [
      numberField('sideFiller', 'Side filler / scribe', 0.75, 8, 0.125),
      numberField('crownHeight', 'Crown height', 1.5, 8, 0.125),
      numberField('crownProjection', 'Crown projection', 0.5, 4, 0.125),
      numberField('toeKickHeight', 'Toe-kick height', 2.5, 6, 0.125),
      numberField('toeKickRecess', 'Toe-kick recess', 1, 5, 0.125),
      numberField('centerGap', 'Gap at chimney', 0, 8, 0.125),
    ],
  });

  appendFieldGroup({
    id: 'finish',
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
  });

  const sourcesSection = document.createElement('details');
  sourcesSection.className = 'control-group advanced-group sources-group';
  sourcesSection.innerHTML = `
    <summary><span><strong>Source &amp; assumptions</strong><small>Room reference and model basis</small></span><i aria-hidden="true">+</i></summary>
    <div class="source-content">
      <div class="source-note" data-source-note></div>
      <a class="reference-card room-reference-card" target="_blank" rel="noreferrer">
        <span class="reference-thumb drawing-thumb" aria-hidden="true"></span>
        <span><strong data-reference-title>Room reference</strong><small data-reference-subtitle>Open supplied room image</small></span>
        <i aria-hidden="true">↗</i>
      </a>
      <a class="reference-card secondary-reference-card" target="_blank" rel="noreferrer" hidden>
        <span class="reference-thumb secondary-reference-thumb" aria-hidden="true"></span>
        <span><strong>Opposing supplied view</strong><small>Open the second room image</small></span>
        <i aria-hidden="true">↗</i>
      </a>
      <a class="reference-card compact-reference-card millwork-reference-card" target="_blank" rel="noreferrer">
        <span><strong>Millwork construction drawing</strong><small>Fixed cabinet logic for every room</small></span>
        <i aria-hidden="true">↗</i>
      </a>
    </div>
  `;
  controlsScroll.appendChild(sourcesSection);

  const sourceNote = required<HTMLElement>(sourcesSection, '[data-source-note]');
  const drawingCard = required<HTMLAnchorElement>(sourcesSection, '.room-reference-card');
  const secondaryReferenceCard = required<HTMLAnchorElement>(sourcesSection, '.secondary-reference-card');
  const millworkCard = required<HTMLAnchorElement>(sourcesSection, '.millwork-reference-card');
  const baseUrl = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
  millworkCard.href = `${baseUrl}reference/bookcase-detail-drawing.png`;

  const chooseRoomLayout = (layoutId: RoomLayoutId): void => {
    if (layoutId === currentConfig.roomLayout) {
      if (catalogDialog.open) catalogDialog.close('unchanged');
      return;
    }
    const next = applyRoomLayoutPreset(currentConfig, layoutId);
    currentConfig = next;
    if (catalogDialog.open) catalogDialog.close('selected');
    callbacks.onConfigChange(next);
  };

  for (const category of LAYOUT_CATEGORIES) {
    const options = ROOM_LAYOUT_OPTIONS.filter((option) => option.category === category.value);
    if (options.length === 0) continue;
    const group = document.createElement('section');
    group.className = 'catalog-group';
    group.innerHTML = `
      <div class="catalog-group-heading"><div><h3>${category.label}</h3><p>${category.description}</p></div><span>${options.length}</span></div>
      <div class="catalog-card-grid"></div>
    `;
    const grid = required<HTMLElement>(group, '.catalog-card-grid');
    for (const option of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'layout-catalog-card';
      button.dataset.layoutId = option.value;
      button.setAttribute('aria-label', `Choose ${option.label}`);
      button.innerHTML = `
        ${layoutSchematic(option.value)}
        <span class="catalog-card-copy">
          <span class="source-badge ${option.sourceKind === 'owner-reference' ? 'is-supplied' : 'is-study'}">${sourceLabel(option.sourceKind)}</span>
          <strong>${escapeHtml(option.label)}</strong>
          <small>${escapeHtml(option.recognitionPrompt)}</small>
        </span>
        <span class="catalog-card-action">Choose <i aria-hidden="true">→</i></span>
      `;
      button.addEventListener('click', () => chooseRoomLayout(option.value));
      grid.appendChild(button);
    }
    catalogGroups.appendChild(group);
  }

  const openCatalog = (opener: HTMLElement): void => {
    catalogOpener = opener;
    catalogDialog.showModal();
    requestAnimationFrame(() => {
      const selected = catalogDialog.querySelector<HTMLButtonElement>('.layout-catalog-card.is-selected');
      (selected ?? required<HTMLButtonElement>(catalogDialog, '.catalog-close')).focus();
    });
  };
  selectedLayoutCard.addEventListener('click', () => openCatalog(selectedLayoutCard));
  browseLayouts.addEventListener('click', () => openCatalog(browseLayouts));
  required<HTMLButtonElement>(catalogDialog, '.catalog-close').addEventListener('click', () => catalogDialog.close());
  catalogDialog.addEventListener('close', () => {
    catalogOpener?.focus();
    catalogOpener = null;
  });
  catalogDialog.addEventListener('click', (event) => {
    if (event.target !== catalogDialog) return;
    const bounds = catalogDialog.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) catalogDialog.close();
  });

  required<HTMLButtonElement>(root, '#reset-model').addEventListener('click', callbacks.onReset);
  required<HTMLButtonElement>(root, '#fit-placement').addEventListener('click', callbacks.onFitPlacement);
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

    const layoutOption = getRoomLayoutOption(config.roomLayout);
    selectedLayoutCard.innerHTML = `
      ${layoutSchematic(layoutOption.value)}
      <span class="selected-layout-copy">
        <span class="source-badge ${layoutOption.sourceKind === 'owner-reference' ? 'is-supplied' : 'is-study'}">${sourceLabel(layoutOption.sourceKind)}</span>
        <strong>${escapeHtml(layoutOption.label)}</strong>
        <small>${escapeHtml(layoutOption.recognitionPrompt)}</small>
      </span>
      <i class="selected-layout-change" aria-hidden="true">Change</i>
    `;
    selectedLayoutCard.setAttribute('aria-label', `Current layout: ${layoutOption.label}. Open layout catalog.`);

    catalogDialog.querySelectorAll<HTMLButtonElement>('[data-layout-id]').forEach((button) => {
      const selected = button.dataset.layoutId === config.roomLayout;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    placementChoices.replaceChildren();
    for (const option of getPlacementOptions(config.roomLayout)) {
      const button = document.createElement('button');
      const selected = option.value === config.placementTarget;
      button.type = 'button';
      button.className = 'placement-choice';
      button.classList.toggle('is-selected', selected);
      button.dataset.placementTarget = option.value;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(selected));
      button.innerHTML = `<span class="radio-dot" aria-hidden="true"><i></i></span><span>${escapeHtml(option.label)}</span>`;
      button.addEventListener('click', () => {
        const next = { ...currentConfig, placementTarget: option.value };
        currentConfig = next;
        callbacks.onConfigChange(next);
      });
      placementChoices.appendChild(button);
    }

    const visibleLayoutKeys = new Set<keyof ModelConfig>(getLayoutDimensionKeys(config.roomLayout));
    for (const definition of openingFields) {
      setFieldVisibility(root, definition.key, visibleLayoutKeys.has(definition.key));
    }
    setFieldVisibility(root, 'roomWidth', config.roomLayout !== 'offset-alcove');
    setFieldVisibility(root, 'roomDepth', config.roomLayout !== 'offset-alcove');

    const activeSides = new Set(derived.bookcasePlacements.map((placement) => placement.sourceSide));
    setFieldVisibility(root, 'leftBookcaseWidth', activeSides.has('left'));
    setFieldVisibility(root, 'rightBookcaseWidth', activeSides.has('right'));
    setFieldLabel(root, 'leftBookcaseWidth', derived.bookcasePlacements.length === 1 ? 'Selected bookcase width' : 'Left overall width');
    setFieldLabel(root, 'rightBookcaseWidth', derived.bookcasePlacements.length === 1 ? 'Selected bookcase width' : 'Right overall width');
    const usesFeatureClearance = [
      'fireplace-wall',
      'window-wall',
      'door-wall',
      'offset-window-wall',
      'double-window-wall',
      'media-wall',
    ].includes(config.roomLayout);
    setFieldVisibility(root, 'centerGap', usesFeatureClearance);
    setFieldLabel(
      root,
      'centerGap',
      config.roomLayout === 'fireplace-wall' ? 'Gap at chimney' : 'Bookcase clearance at feature',
    );
    setFieldVisibility(root, 'showFire', derived.hasFireplace);

    const fireplaceGroup = root.querySelector<HTMLElement>('[data-control-group="fireplace"]');
    if (fireplaceGroup) fireplaceGroup.hidden = !derived.hasFireplace;
    const fireplaceView = root.querySelector<HTMLButtonElement>('[data-view="fireplace"]');
    const rightDetailView = root.querySelector<HTMLButtonElement>('[data-view="right-detail"]');
    const leftDetailView = root.querySelector<HTMLButtonElement>('[data-view="left-detail"]');
    if (fireplaceView) fireplaceView.hidden = !derived.hasFireplace;
    if (rightDetailView) rightDetailView.hidden = derived.bookcasePlacements.length < 2;
    if (leftDetailView) leftDetailView.textContent = derived.bookcasePlacements.length < 2 ? 'Bookcase' : 'Left detail';

    updateSourceCards(layoutOption, baseUrl, sourceNote, drawingCard, secondaryReferenceCard);
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
    setStatus: (message) => { shell.statusText.textContent = message; },
    setFps: (fps) => { shell.fpsText.textContent = fps > 0 ? `${Math.round(fps)} fps` : ''; },
  };
}

function stepHeading(number: string, title: string, description: string): string {
  return `
    <div class="step-heading">
      <span class="step-number">${number}</span>
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></div>
    </div>
  `;
}

function layoutSchematic(layoutId: RoomLayoutId): string {
  const parts: Record<string, string> = {
    'fireplace-wall': '<i class="sch-case sch-left"></i><i class="sch-fireplace"></i><i class="sch-case sch-right"></i>',
    'straight-wall': '<i class="sch-case sch-center"></i>',
    'window-wall': '<i class="sch-case sch-left"></i><i class="sch-window sch-center-window"></i><i class="sch-case sch-right"></i>',
    'center-niche': '<i class="sch-wing sch-left-wing"></i><i class="sch-recess"></i><i class="sch-case sch-center"></i><i class="sch-wing sch-right-wing"></i>',
    'offset-alcove': '<i class="sch-side sch-side-left"></i><i class="sch-side sch-side-right"></i><i class="sch-case sch-wide"></i>',
    'door-wall': '<i class="sch-door"></i><i class="sch-case sch-door-side"></i>',
    'offset-window-wall': '<i class="sch-window sch-offset-window"></i><i class="sch-case sch-window-side"></i>',
    'double-window-wall': '<i class="sch-window sch-window-one"></i><i class="sch-case sch-window-middle"></i><i class="sch-window sch-window-two"></i>',
    'media-wall': '<i class="sch-case sch-left"></i><i class="sch-media"></i><i class="sch-case sch-right"></i>',
    'side-nook': '<i class="sch-side sch-nook-side"></i><i class="sch-recess sch-side-recess"></i><i class="sch-case sch-nook-case"></i>',
  };
  return `<span class="layout-schematic" data-layout-schematic="${escapeHtml(layoutId)}" aria-hidden="true"><span class="schematic-stage"><i class="sch-wall"></i>${parts[layoutId] ?? ''}<i class="sch-floor"></i></span></span>`;
}

function sourceLabel(sourceKind: 'owner-reference' | 'catalog-study'): string {
  return sourceKind === 'owner-reference' ? 'Supplied' : 'Common scenario';
}

function updateSourceCards(
  layoutOption: ReturnType<typeof getRoomLayoutOption>,
  baseUrl: string,
  sourceNote: HTMLElement,
  drawingCard: HTMLAnchorElement,
  secondaryReferenceCard: HTMLAnchorElement,
): void {
  const isSupplied = layoutOption.sourceKind === 'owner-reference';
  sourceNote.className = `source-note ${isSupplied ? 'is-supplied' : 'is-study'}`;
  sourceNote.innerHTML = isSupplied
    ? `<span class="source-badge is-supplied">Supplied</span><p>This room geometry is interpreted from an owner-supplied reference image. Dimensions without labels remain editable study assumptions.</p>`
    : `<span class="source-badge is-study">Common scenario</span><p>This catalog room is a generated planning study, not a supplied reference. Replace its editable assumptions with field measurements or customer photos before design approval.</p>`;

  if (layoutOption.referenceFile) {
    const referenceUrl = `${baseUrl}${layoutOption.referenceFile}`;
    drawingCard.href = referenceUrl;
    drawingCard.hidden = false;
    required<HTMLElement>(drawingCard, '.drawing-thumb').style.backgroundImage = `url("${referenceUrl}")`;
    required<HTMLElement>(drawingCard, '[data-reference-title]').textContent = `${layoutOption.label} reference`;
    required<HTMLElement>(drawingCard, '[data-reference-subtitle]').textContent = layoutOption.description;
  } else {
    drawingCard.hidden = true;
    drawingCard.removeAttribute('href');
    required<HTMLElement>(drawingCard, '.drawing-thumb').style.backgroundImage = '';
  }

  if (layoutOption.secondaryReferenceFile) {
    const secondaryUrl = `${baseUrl}${layoutOption.secondaryReferenceFile}`;
    secondaryReferenceCard.href = secondaryUrl;
    required<HTMLElement>(secondaryReferenceCard, '.secondary-reference-thumb').style.backgroundImage = `url("${secondaryUrl}")`;
    secondaryReferenceCard.hidden = false;
  } else {
    secondaryReferenceCard.hidden = true;
    secondaryReferenceCard.removeAttribute('href');
    required<HTMLElement>(secondaryReferenceCard, '.secondary-reference-thumb').style.backgroundImage = '';
  }
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
  label.innerHTML = `<span>${escapeHtml(definition.label)}</span>${definition.help ? `<small>${escapeHtml(definition.help)}</small>` : ''}`;
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
    select.addEventListener('change', () => onChange(definition.key, select.value));
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

function selectField(key: keyof ModelConfig, label: string, options: FieldDefinition['options']): FieldDefinition {
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

function updateDerivedReadout(readout: HTMLElement, derived: DerivedLayout): void {
  readout.classList.toggle('is-single', derived.bookcasePlacements.length === 1);
  required<HTMLElement>(readout, '[data-derived="opening-label"]').textContent = derived.selectedOpeningLabel;
  required<HTMLElement>(readout, '[data-derived="opening-width"]').textContent = formatInches(derived.selectedOpeningWidth);
  for (const index of [0, 1] as const) {
    const card = required<HTMLElement>(readout, `[data-derived-unit="${index}"]`);
    const placement = derived.bookcasePlacements[index];
    card.hidden = !placement;
    if (!placement) continue;
    const isLeft = placement.sourceSide === 'left';
    const bayWidth = isLeft ? derived.leftBayWidth : derived.rightBayWidth;
    const shelfThickness = isLeft ? derived.leftAdjustableShelfThickness : derived.rightAdjustableShelfThickness;
    const supportRequired = isLeft ? derived.leftShelfSupportRequired : derived.rightShelfSupportRequired;
    required<HTMLElement>(card, `[data-derived="unit-${index}-label"]`).textContent = `${placement.label} clear bay`;
    required<HTMLElement>(card, `[data-derived="unit-${index}-span"]`).textContent = formatInches(bayWidth);
    required<HTMLElement>(card, `[data-derived="unit-${index}-shelf"]`).textContent = formatShelfValue(shelfThickness, supportRequired);
  }
}

function formatShelfValue(value: number, supportRequired: boolean): string {
  return `Shelf ${formatInches(value)}${supportRequired ? ' · support required' : ''}`;
}

function setFieldVisibility(root: ParentNode, key: keyof ModelConfig, visible: boolean): void {
  const row = root.querySelector<HTMLElement>(`[data-field-key="${String(key)}"]`);
  if (row) row.hidden = !visible;
}

function setFieldLabel(root: ParentNode, key: keyof ModelConfig, label: string): void {
  const element = root.querySelector<HTMLElement>(`[data-field-key="${String(key)}"] .field-label > span`);
  if (element) element.textContent = label;
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
