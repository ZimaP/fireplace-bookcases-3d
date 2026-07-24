import type {
  DerivedLayout,
  ModelConfig,
  RoomLayoutId,
} from '../model/config';
import {
  applyRoomLayoutPreset,
  configToUrl,
  deriveLayout,
  fitBookcasesToSelectedOpening,
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
  onCopySummary: () => void;
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

const WIZARD_STEPS = [
  { number: 1, shortLabel: 'Design', title: 'Choose your bookcase' },
  { number: 2, shortLabel: 'Room', title: 'Match your room' },
  { number: 3, shortLabel: 'Measure', title: 'Measure your space' },
  { number: 4, shortLabel: 'Finish', title: 'Make it yours' },
] as const;

const LAYOUT_CATEGORIES = [
  { value: 'feature-walls', label: 'Fireplace & media', description: 'A central feature with useful wall space beside it.' },
  { value: 'simple-walls', label: 'Clear walls & doorways', description: 'An open wall or a wall interrupted by a doorway.' },
  { value: 'window-walls', label: 'Window walls', description: 'One or two windows with space for a built-in.' },
  { value: 'recesses', label: 'Niches & nooks', description: 'A recessed area, deep alcove, or side nook.' },
] as const;

const FINISH_OPTIONS: ReadonlyArray<{
  value: ModelConfig['cabinetFinish'];
  label: string;
  description: string;
}> = [
  { value: 'warm-white', label: 'Warm white', description: 'Soft and traditional' },
  { value: 'pure-white', label: 'Pure white', description: 'Clean and bright' },
  { value: 'soft-gray', label: 'Soft gray', description: 'Calm and modern' },
  { value: 'deep-green', label: 'Deep green', description: 'Rich and dramatic' },
];

const PRIMARY_MEASUREMENT_KEYS: Readonly<Record<RoomLayoutId, readonly (keyof ModelConfig)[]>> = {
  'fireplace-wall': ['roomWidth', 'roomHeight', 'bookcaseHeight', 'chimneyWidth', 'chimneyDepth'],
  'straight-wall': ['wallOpeningWidth', 'roomHeight', 'bookcaseHeight'],
  'window-wall': ['roomWidth', 'windowWidth', 'roomHeight', 'bookcaseHeight'],
  'center-niche': ['nicheWidth', 'nicheDepth', 'roomHeight', 'bookcaseHeight'],
  'offset-alcove': ['alcoveOpeningWidth', 'alcoveDepth', 'roomHeight', 'bookcaseHeight'],
  'door-wall': ['roomWidth', 'doorWidth', 'doorCenterX', 'roomHeight', 'bookcaseHeight'],
  'offset-window-wall': ['roomWidth', 'windowWidth', 'windowCenterX', 'roomHeight', 'bookcaseHeight'],
  'double-window-wall': ['roomWidth', 'windowWidth', 'doubleWindowGap', 'roomHeight', 'bookcaseHeight'],
  'media-wall': ['roomWidth', 'mediaZoneWidth', 'roomHeight', 'bookcaseHeight'],
  'side-nook': ['sideNookWidth', 'sideNookDepth', 'roomHeight', 'bookcaseHeight'],
};

const MEASUREMENT_FIELDS: FieldDefinition[] = [
  numberField('roomWidth', 'Full wall width', 72, 360, 0.25, 'in', 'Measure from wall to wall.'),
  numberField('roomDepth', 'Room depth', 72, 300, 0.25),
  numberField('roomHeight', 'Ceiling height', 84, 168, 0.25, 'in', 'Measure from the finished floor to the ceiling.'),
  numberField('bookcaseHeight', 'Finished bookcase height', 72, 156, 0.125, 'in', 'Enter the overall height you want. It must stay at least 1/2 in below the ceiling.'),
  numberField('wallOpeningWidth', 'Width available for the bookcase', 44, 180, 0.125),
  numberField('windowWidth', 'Window opening width (without trim)', 24, 96, 0.125),
  numberField('windowHeight', 'Window height', 24, 72, 0.125),
  numberField('windowSillHeight', 'Floor to window sill', 18, 60, 0.125),
  numberField('windowCenterX', 'Window position (0 = centered)', -48, 48, 0.125, 'in', 'Minus moves it left; plus moves it right.'),
  numberField('doubleWindowGap', 'Clear space between window trims', 44, 120, 0.125),
  numberField('nicheWidth', 'Clear niche width', 44, 144, 0.125),
  numberField('nicheDepth', 'Niche depth', 12, 48, 0.125),
  numberField('alcoveOpeningWidth', 'Clear alcove width', 44, 108, 0.125),
  numberField('alcoveDepth', 'Alcove depth', 48, 240, 0.25),
  numberField('chimneyWidth', 'Fireplace / chimney width', 42, 96, 0.25),
  numberField('chimneyDepth', 'Fireplace projection from wall', 3, 24, 0.25),
  numberField('doorWidth', 'Door opening width (without trim)', 28, 72, 0.125),
  numberField('doorHeight', 'Door opening height', 72, 96, 0.125),
  numberField('doorCenterX', 'Door position (0 = centered)', -48, 48, 0.125, 'in', 'Minus moves it left; plus moves it right.'),
  numberField('mediaZoneWidth', 'Width to keep clear for the TV', 48, 120, 0.125),
  numberField('mediaZoneHeight', 'Height to keep clear for the TV', 32, 72, 0.125),
  numberField('sideNookWidth', 'Clear nook width', 44, 144, 0.125),
  numberField('sideNookDepth', 'Nook depth', 12, 48, 0.125),
];

const MEASUREMENT_KEYS = new Set<keyof ModelConfig>(
  MEASUREMENT_FIELDS.map((field) => field.key),
);

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
            <div class="eyebrow">Built for your room</div>
            <h1>Built-in Bookcase Planner</h1>
          </div>
        </div>

        <nav class="view-presets" aria-label="Preview views">
          <button type="button" data-view="hero" class="active" aria-pressed="true">3D room</button>
          <button type="button" data-view="front" aria-pressed="false">Front</button>
          <details class="more-views">
            <summary>More views</summary>
            <div class="more-views-menu">
              <button type="button" data-view="plan" aria-pressed="false">Top view</button>
              <button type="button" data-view="left-detail" aria-pressed="false">Bookcase detail</button>
              <button type="button" data-view="right-detail" aria-pressed="false">Other side</button>
              <button type="button" data-view="fireplace" aria-pressed="false">Fireplace detail</button>
            </div>
          </details>
        </nav>

        <div class="top-actions">
          <button type="button" id="reset-model" class="text-button">Start over</button>
        </div>
      </header>

      <aside class="control-panel" aria-label="Guided bookcase planner">
        <div class="panel-heading">
          <div class="step-count" data-step-count>Step 1 of 4</div>
          <h2 data-step-title tabindex="-1">Choose your bookcase</h2>
          <ol class="wizard-progress" aria-label="Planner progress">
            ${WIZARD_STEPS.map((step) => `
              <li>
                <button type="button" data-step-nav="${step.number}" aria-label="Go to ${step.title}">
                  <span>${step.number}</span><small>${step.shortLabel}</small>
                </button>
              </li>
            `).join('')}
          </ol>
        </div>

        <div id="controls-scroll" class="controls-scroll">
          <section class="wizard-page" data-step-page="1">
            <p class="page-intro">Start with our current bookcase design. You will match it to your room and measurements next.</p>
            <div class="section-label design-section-label">
              <span>Your bookcase design</span>
              <small>Available now</small>
            </div>
            <button type="button" class="bookcase-design-card">
              <span class="design-preview" aria-hidden="true">
                <span class="design-bookcase">
                  <i class="design-crown"></i>
                  <i class="design-divider"></i>
                  <i class="design-shelf shelf-one"></i>
                  <i class="design-shelf shelf-two"></i>
                  <i class="design-shelf shelf-three"></i>
                  <i class="design-counter"></i>
                  <i class="design-door door-one"></i>
                  <i class="design-door door-two"></i>
                  <i class="design-door door-three"></i>
                  <i class="design-door door-four"></i>
                </span>
              </span>
              <span class="design-card-copy">
                <strong>Classic Shaker built-in</strong>
                <small>Two open upper bays with four lower cabinet doors.</small>
                <span class="design-features"><i>Adjustable shelves</i><i>Closed storage</i></span>
                <span class="design-card-action">Start with this design <i aria-hidden="true">→</i></span>
              </span>
            </button>
            <div class="reassurance-card">
              <span aria-hidden="true">✓</span>
              <p><strong>Construction details stay consistent.</strong> Width and height can change without stretching material thicknesses.</p>
            </div>
          </section>

          <section class="wizard-page" data-step-page="2" hidden>
            <p class="page-intro">Choose the wall that feels closest to your room. It does not need to be exact yet.</p>
            <div class="section-label">
              <span>Your room</span>
              <small>Choose the closest match</small>
            </div>
            <button type="button" class="selected-layout-card" aria-haspopup="dialog" aria-controls="layout-catalog"></button>
            <button type="button" class="browse-layouts-button quiet-button" aria-haspopup="dialog" aria-controls="layout-catalog">
              See all room types
            </button>

            <div class="placement-section">
              <div class="section-label">
                <span>Where should it go?</span>
                <small>Only positions that work for this room are shown</small>
              </div>
              <div class="placement-choices" role="radiogroup" aria-label="Bookcase position"></div>
            </div>
          </section>

          <section class="wizard-page" data-step-page="3" hidden>
            <p class="page-intro">Enter the few measurements that shape this layout. You can use an estimate now and replace it later.</p>
            <fieldset class="measurement-confidence">
              <legend>How exact are these measurements?</legend>
              <div class="measurement-confidence-options" role="radiogroup" aria-label="Measurement confidence">
                <button type="button" data-measurement-confidence="estimated" role="radio" aria-checked="false">
                  <span class="radio-dot" aria-hidden="true"><i></i></span>
                  <span><strong>Planning estimate</strong><small>Good for exploring the idea</small></span>
                </button>
                <button type="button" data-measurement-confidence="measured" role="radio" aria-checked="false">
                  <span class="radio-dot" aria-hidden="true"><i></i></span>
                  <span><strong>Measured by me</strong><small>Entered from a tape measure</small></span>
                </button>
              </div>
            </fieldset>
            <div class="measurement-note">
              <span aria-hidden="true">↔</span>
              <p><strong>Use inches or a fraction.</strong> You can enter 67.5 or 67 1/2. Measure finished surfaces; do not include window or door trim.</p>
            </div>
            <div class="derived-readout" aria-live="polite">
              <div class="derived-readout-heading">
                <span>Your fitted size</span>
                <strong data-derived="opening-label">Selected opening</strong>
                <small><span data-derived="opening-width">—</span> available</small>
              </div>
              <div class="derived-readout-grid">
                <div data-derived-unit="0">
                  <span data-derived="unit-0-label">Bookcase</span>
                  <strong data-derived="unit-0-width">—</strong>
                  <small data-derived="unit-0-note">Ready to fit</small>
                </div>
                <div data-derived-unit="1">
                  <span data-derived="unit-1-label">Bookcase</span>
                  <strong data-derived="unit-1-width">—</strong>
                  <small data-derived="unit-1-note">Ready to fit</small>
                </div>
              </div>
            </div>
            <div class="field-stack primary-measurement-fields"></div>
            <details class="secondary-measurements">
              <summary><span>More room measurements</span><i aria-hidden="true">+</i></summary>
              <p>Optional details make the room preview more accurate.</p>
              <div class="field-stack secondary-measurement-fields"></div>
            </details>
          </section>

          <section class="wizard-page" data-step-page="4" hidden>
            <p class="page-intro">Pick a cabinet color, review the result, and save or share your room design.</p>
            <div class="section-label">
              <span>Cabinet color</span>
              <small>You can change this anytime</small>
            </div>
            <div class="finish-picker" role="radiogroup" aria-label="Cabinet color">
              ${FINISH_OPTIONS.map((finish) => `
                <button type="button" data-cabinet-finish="${finish.value}" role="radio" aria-checked="false">
                  <i class="finish-swatch finish-${finish.value}" aria-hidden="true"><span>✓</span></i>
                  <span><strong>${finish.label}</strong><small>${finish.description}</small></span>
                </button>
              `).join('')}
            </div>

            <div class="review-card" aria-live="polite">
              <div class="review-heading">
                <span class="review-check" aria-hidden="true">✓</span>
                <div><strong data-review-status>Your planning preview is ready</strong><small data-review-status-note>It fits the measurements entered.</small></div>
              </div>
              <dl>
                <div><dt>Bookcase</dt><dd>Classic Shaker</dd></div>
                <div><dt>Room</dt><dd data-review-room>Fireplace wall</dd></div>
                <div><dt>Placement</dt><dd data-review-placement>Pair flanking fireplace</dd></div>
                <div><dt>Overall size</dt><dd data-review-size>—</dd></div>
                <div><dt>Color</dt><dd data-review-finish>Warm white</dd></div>
                <div><dt>Measurements</dt><dd data-review-confidence>Planning estimate</dd></div>
              </dl>
              <p class="review-disclaimer">Planning preview only. Final dimensions and site conditions require field verification before approval.</p>
            </div>

            <div class="review-actions">
              <button type="button" class="quiet-button" data-action="copy">Copy share link</button>
              <button type="button" class="quiet-button" data-action="copy-summary">Copy project details</button>
            </div>

            <details class="fine-tune">
              <summary><span><strong>Advanced details</strong><small>Designer review recommended</small></span><i aria-hidden="true">+</i></summary>
              <div class="fine-tune-content"></div>
            </details>
          </section>
        </div>

        <footer class="wizard-footer">
          <button type="button" class="wizard-back text-button">Back</button>
          <button type="button" class="wizard-primary primary-button">Continue with this style <span aria-hidden="true">→</span></button>
        </footer>
      </aside>

      <main id="viewport" class="viewport">
        <div id="canvas-host" class="canvas-host"></div>
        <div id="overlay-host" class="overlay-host"></div>
        <div class="viewport-vignette" aria-hidden="true"></div>
        <div class="viewport-help">Drag to rotate <i>•</i> Scroll to zoom <i>•</i> Click a cabinet part for details</div>
        <div id="part-inspector" class="part-inspector is-empty">
          <div class="part-kicker">Selected part</div>
          <strong>Select any cabinet component</strong>
          <p>Dimensions, material, and construction notes will appear here.</p>
        </div>
        <div id="warning-panel" class="warning-panel" role="status" aria-live="polite" hidden></div>
        <div class="viewer-status">
          <span id="status-text" role="status" aria-live="polite">Preparing your 3D room…</span>
          <span id="fps-text"></span>
        </div>
      </main>

      <div id="desktop-blocker" class="desktop-blocker">
        <div>
          <strong>Open this planner on a wider screen</strong>
          <p>The detailed 3D room works best on a laptop or desktop.</p>
        </div>
      </div>

      <dialog id="layout-catalog" class="layout-catalog" aria-labelledby="layout-catalog-title" aria-describedby="layout-catalog-description">
        <div class="catalog-dialog-shell">
          <header class="catalog-dialog-header">
            <div>
              <div class="eyebrow">Choose a starting point</div>
              <h2 id="layout-catalog-title">Which wall looks most like yours?</h2>
              <p id="layout-catalog-description">Pick the closest match. You will add your own measurements next.</p>
            </div>
            <button type="button" class="catalog-close icon-button" aria-label="Close room choices">×</button>
          </header>
          <div class="catalog-scroll" data-catalog-groups></div>
        </div>
      </dialog>

      <dialog id="reset-confirm" class="confirm-dialog" aria-labelledby="reset-confirm-title">
        <div class="confirm-dialog-content">
          <span class="confirm-icon" aria-hidden="true">↺</span>
          <h2 id="reset-confirm-title">Start over?</h2>
          <p>This will return the planner to the original fireplace room and default measurements.</p>
          <div>
            <button type="button" class="quiet-button" data-reset-cancel>Keep my design</button>
            <button type="button" class="primary-button" data-reset-confirm>Start over</button>
          </div>
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
  const wizardTitle = required<HTMLElement>(root, '[data-step-title]');
  const wizardCount = required<HTMLElement>(root, '[data-step-count]');
  const wizardBack = required<HTMLButtonElement>(root, '.wizard-back');
  const wizardPrimary = required<HTMLButtonElement>(root, '.wizard-primary');
  const catalogDialog = required<HTMLDialogElement>(root, '#layout-catalog');
  const catalogGroups = required<HTMLElement>(catalogDialog, '[data-catalog-groups]');
  const resetDialog = required<HTMLDialogElement>(root, '#reset-confirm');
  const selectedLayoutCard = required<HTMLButtonElement>(root, '.selected-layout-card');
  const bookcaseDesignCard = required<HTMLButtonElement>(root, '.bookcase-design-card');
  const browseLayouts = required<HTMLButtonElement>(root, '.browse-layouts-button');
  const placementSection = required<HTMLElement>(root, '.placement-section');
  const placementChoices = required<HTMLElement>(root, '.placement-choices');
  const measurementConfidenceOptions = required<HTMLElement>(root, '.measurement-confidence-options');
  const primaryMeasurementFields = required<HTMLElement>(root, '.primary-measurement-fields');
  const secondaryMeasurementFields = required<HTMLElement>(root, '.secondary-measurement-fields');
  const secondaryMeasurements = required<HTMLDetailsElement>(root, '.secondary-measurements');
  const finishPicker = required<HTMLElement>(root, '.finish-picker');
  const fineTuneContent = required<HTMLElement>(root, '.fine-tune-content');
  const derivedReadout = required<HTMLElement>(root, '.derived-readout');
  const inputMap = new Map<keyof ModelConfig, HTMLInputElement | HTMLSelectElement>();
  const measurementRows = new Map<keyof ModelConfig, HTMLElement>();
  let currentConfig = { ...initialConfig };
  const opensAtReview = new URLSearchParams(window.location.search).get('step') === 'review';
  let currentStep = opensAtReview ? 4 : 1;
  let maximumVisitedStep = opensAtReview ? 4 : 1;
  let catalogOpener: HTMLElement | null = null;

  const updateConfig = (
    key: keyof ModelConfig,
    rawValue: string | number | boolean,
  ): void => {
    const next = { ...currentConfig };
    const current = next[key];
    if (typeof current === 'number') {
      (next[key] as number) = Number(rawValue);
    } else if (typeof current === 'boolean') {
      (next[key] as boolean) = Boolean(rawValue);
    } else {
      (next[key] as string) = String(rawValue);
    }
    const fittedNext = MEASUREMENT_KEYS.has(key)
      ? fitBookcasesToSelectedOpening(next)
      : next;
    currentConfig = fittedNext;
    callbacks.onConfigChange(fittedNext);
  };

  for (const definition of MEASUREMENT_FIELDS) {
    const row = createField(definition, currentConfig, updateConfig);
    row.element.dataset.fieldKey = String(definition.key);
    inputMap.set(definition.key, row.input);
    measurementRows.set(definition.key, row.element);
    primaryMeasurementFields.appendChild(row.element);
  }

  const appendFieldGroup = (
    definition: FieldGroupDefinition,
    parent: HTMLElement,
  ): HTMLElement => {
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
      const row = createField(fieldDefinition, currentConfig, updateConfig);
      row.element.dataset.fieldKey = String(fieldDefinition.key);
      inputMap.set(fieldDefinition.key, row.input);
      fields.appendChild(row.element);
    }
    section.appendChild(fields);
    parent.appendChild(section);
    return section;
  };

  appendFieldGroup({
    id: 'bookcases',
    title: 'Bookcase size',
    subtitle: 'Optional adjustments after the automatic fit',
    advanced: true,
    fields: [
      numberField('leftBookcaseWidth', 'Left overall width', 44, 180, 0.125),
      numberField('rightBookcaseWidth', 'Right overall width', 44, 180, 0.125),
      numberField('upperDepth', 'Upper depth', 10, 22, 0.125),
      numberField('baseDepth', 'Base depth', 16, 30, 0.125),
      numberField('baseHeight', 'Base cabinet height', 24, 42, 0.125),
      numberField('shelfCount', 'Shelves per bay', 2, 8, 1, ''),
    ],
  }, fineTuneContent);

  appendFieldGroup({
    id: 'fireplace',
    title: 'Fireplace & mantel',
    subtitle: 'Detailed fireplace presentation sizes',
    advanced: true,
    fields: [
      numberField('fireplaceOpeningWidth', 'Firebox opening width', 24, 60, 0.125),
      numberField('fireplaceOpeningHeight', 'Firebox opening height', 18, 42, 0.125),
      numberField('mantelWidth', 'Mantel width', 42, 84, 0.125),
      numberField('mantelHeight', 'Mantel height', 34, 62, 0.125),
      numberField('mantelDepth', 'Mantel depth', 6, 18, 0.125),
      numberField('hearthWidth', 'Hearth width', 42, 96, 0.125),
      numberField('hearthDepth', 'Hearth projection', 10, 30, 0.125),
    ],
  }, fineTuneContent);

  appendFieldGroup({
    id: 'installation',
    title: 'Installation details',
    subtitle: 'Field-fit values for a designer or installer',
    advanced: true,
    fields: [
      numberField('sideFiller', 'Side filler / scribe', 0.75, 8, 0.125),
      numberField('crownHeight', 'Top filler height', 1.5, 8, 0.125),
      numberField('crownProjection', 'Top filler projection', 0.5, 4, 0.125),
      numberField('toeKickHeight', 'Toe-kick height', 2.5, 6, 0.125),
      numberField('toeKickRecess', 'Toe-kick recess', 1, 5, 0.125),
      numberField('centerGap', 'Clearance at center feature', 0, 8, 0.125),
    ],
  }, fineTuneContent);

  appendFieldGroup({
    id: 'appearance',
    title: 'Room & display',
    subtitle: 'Floor color and optional model details',
    advanced: true,
    fields: [
      selectField('floorFinish', 'Floor finish', [
        { value: 'natural-oak', label: 'Natural oak' },
        { value: 'white-oak', label: 'White oak' },
        { value: 'walnut', label: 'Walnut' },
      ]),
      checkboxField('showDimensions', 'Show measurements in 3D'),
      checkboxField('showHardware', 'Show cabinet hardware'),
      checkboxField('showPinHoles', 'Show shelf-pin holes'),
      checkboxField('showFire', 'Animate the electric fire'),
      checkboxField('showRoom', 'Show the room'),
      checkboxField('showCeiling', 'Show the ceiling'),
    ],
  }, fineTuneContent);

  const sourcesSection = document.createElement('details');
  sourcesSection.className = 'control-group advanced-group sources-group';
  sourcesSection.innerHTML = `
    <summary><span><strong>References &amp; assumptions</strong><small>Room image and construction basis</small></span><i aria-hidden="true">+</i></summary>
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
  fineTuneContent.appendChild(sourcesSection);

  const sourceNote = required<HTMLElement>(sourcesSection, '[data-source-note]');
  const drawingCard = required<HTMLAnchorElement>(sourcesSection, '.room-reference-card');
  const secondaryReferenceCard = required<HTMLAnchorElement>(sourcesSection, '.secondary-reference-card');
  const millworkCard = required<HTMLAnchorElement>(sourcesSection, '.millwork-reference-card');
  const baseUrl = (import.meta as ImportMeta & { env: { BASE_URL: string } }).env.BASE_URL;
  millworkCard.href = `${baseUrl}reference/bookcase-detail-drawing.png`;

  const chooseRoomLayout = (layoutId: RoomLayoutId): void => {
    if (layoutId !== currentConfig.roomLayout) {
      const next = fitBookcasesToSelectedOpening(
        applyRoomLayoutPreset(currentConfig, layoutId),
      );
      currentConfig = next;
      callbacks.onConfigChange(next);
    }
    maximumVisitedStep = Math.max(maximumVisitedStep, 2);
    if (catalogDialog.open) catalogDialog.close('selected');
  };

  for (const category of LAYOUT_CATEGORIES) {
    const options = ROOM_LAYOUT_OPTIONS.filter((option) => option.category === category.value);
    if (options.length === 0) continue;
    const group = document.createElement('section');
    group.className = 'catalog-group';
    group.innerHTML = `
      <div class="catalog-group-heading">
        <div><h3>${category.label}</h3><p>${category.description}</p></div>
      </div>
      <div class="catalog-card-grid"></div>
    `;
    const grid = required<HTMLElement>(group, '.catalog-card-grid');
    for (const option of options) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'layout-catalog-card';
      button.dataset.layoutId = option.value;
      const titleId = `room-title-${option.value}`;
      const descriptionId = `room-description-${option.value}`;
      button.setAttribute('aria-labelledby', titleId);
      button.setAttribute('aria-describedby', descriptionId);
      button.innerHTML = `
        ${layoutSchematic(option.value)}
        <span class="catalog-card-copy">
          <span class="source-badge ${option.sourceKind === 'owner-reference' ? 'is-supplied' : 'is-study'}">${sourceLabel(option.sourceKind)}</span>
          <strong id="${titleId}">${escapeHtml(option.label)}</strong>
          <small id="${descriptionId}">${escapeHtml(option.recognitionPrompt)}</small>
        </span>
        <span class="catalog-card-action">Choose this room <i aria-hidden="true">→</i></span>
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

  const setActiveStep = (nextStep: number, focusHeading = true): void => {
    if (nextStep === 3 && currentStep < 3) {
      const fitted = fitBookcasesToSelectedOpening(currentConfig);
      currentConfig = fitted;
      callbacks.onConfigChange(fitted);
    }
    currentStep = Math.max(1, Math.min(WIZARD_STEPS.length, nextStep));
    maximumVisitedStep = Math.max(maximumVisitedStep, currentStep);
    const step = WIZARD_STEPS[currentStep - 1];
    wizardCount.textContent = `Step ${currentStep} of ${WIZARD_STEPS.length}`;
    wizardTitle.textContent = step.title;
    root.querySelectorAll<HTMLElement>('[data-step-page]').forEach((page) => {
      page.hidden = Number(page.dataset.stepPage) !== currentStep;
    });
    root.querySelectorAll<HTMLButtonElement>('[data-step-nav]').forEach((button) => {
      const number = Number(button.dataset.stepNav);
      const active = number === currentStep;
      button.disabled = number > maximumVisitedStep;
      button.classList.toggle('is-active', active);
      button.classList.toggle('is-complete', number < currentStep);
      if (active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    wizardBack.hidden = currentStep === 1;
    if (currentStep === 1) wizardPrimary.innerHTML = 'Continue with this style <span aria-hidden="true">→</span>';
    if (currentStep === 2) wizardPrimary.innerHTML = 'Measure my space <span aria-hidden="true">→</span>';
    if (currentStep === 3) wizardPrimary.innerHTML = 'Review my design <span aria-hidden="true">→</span>';
    if (currentStep === 4) wizardPrimary.innerHTML = 'Save design image <span aria-hidden="true">↓</span>';
    controlsScroll.scrollTop = 0;
    if (focusHeading) wizardTitle.focus({ preventScroll: true });
  };

  bookcaseDesignCard.setAttribute('aria-label', 'Use Classic Shaker and continue');
  bookcaseDesignCard.addEventListener('click', () => setActiveStep(2));
  root.querySelectorAll<HTMLButtonElement>('[data-step-nav]').forEach((button) => {
    button.addEventListener('click', () => setActiveStep(Number(button.dataset.stepNav)));
  });
  wizardBack.addEventListener('click', () => setActiveStep(currentStep - 1));
  wizardPrimary.addEventListener('click', () => {
    if (currentStep === 1) {
      setActiveStep(2);
      return;
    }
    if (currentStep === 2) {
      setActiveStep(3);
      return;
    }
    if (currentStep === 3) {
      const invalidMeasurement = root.querySelector<HTMLInputElement>(
        '[data-step-page="3"] input[aria-invalid="true"]',
      );
      if (invalidMeasurement) {
        invalidMeasurement.closest<HTMLDetailsElement>('details')?.setAttribute('open', '');
        invalidMeasurement.focus();
        return;
      }
      callbacks.onFitPlacement();
      setActiveStep(4);
      return;
    }
    callbacks.onSaveImage();
  });

  required<HTMLButtonElement>(root, '#reset-model').addEventListener('click', () => {
    resetDialog.showModal();
    requestAnimationFrame(() => required<HTMLButtonElement>(resetDialog, '[data-reset-cancel]').focus());
  });
  required<HTMLButtonElement>(resetDialog, '[data-reset-cancel]').addEventListener('click', () => resetDialog.close());
  required<HTMLButtonElement>(resetDialog, '[data-reset-confirm]').addEventListener('click', () => {
    callbacks.onReset();
    maximumVisitedStep = 1;
    setActiveStep(1);
    resetDialog.close();
  });
  resetDialog.addEventListener('click', (event) => {
    if (event.target === resetDialog) resetDialog.close();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-action="save"]').forEach((button) => {
    button.addEventListener('click', callbacks.onSaveImage);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-action="copy"]').forEach((button) => {
    button.addEventListener('click', callbacks.onCopyLink);
  });
  root.querySelectorAll<HTMLButtonElement>('[data-action="copy-summary"]').forEach((button) => {
    button.addEventListener('click', callbacks.onCopySummary);
  });

  root.querySelectorAll<HTMLButtonElement>('[data-cabinet-finish]').forEach((button) => {
    button.addEventListener('click', () => {
      updateConfig('cabinetFinish', button.dataset.cabinetFinish ?? 'warm-white');
    });
  });
  placementChoices.addEventListener('keydown', (event) => {
    handleRadioGroupKeydown(event, placementChoices, '.placement-choice');
  });
  finishPicker.addEventListener('keydown', (event) => {
    handleRadioGroupKeydown(event, finishPicker, '[data-cabinet-finish]');
  });
  root.querySelectorAll<HTMLButtonElement>('[data-measurement-confidence]').forEach((button) => {
    button.addEventListener('click', () => {
      updateConfig('measurementConfidence', button.dataset.measurementConfidence ?? 'estimated');
    });
  });
  measurementConfidenceOptions.addEventListener('keydown', (event) => {
    handleRadioGroupKeydown(event, measurementConfidenceOptions, '[data-measurement-confidence]');
  });

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
      button.closest<HTMLDetailsElement>('details')?.removeAttribute('open');
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
        if (input instanceof HTMLInputElement) {
          input.removeAttribute('aria-invalid');
          input.dataset.committedValue = String(value);
          updateMeasurementConversion(input, Number(value));
        }
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
    selectedLayoutCard.setAttribute('aria-label', `Current room: ${layoutOption.label}. Open room choices.`);

    catalogDialog.querySelectorAll<HTMLButtonElement>('[data-layout-id]').forEach((button) => {
      const selected = button.dataset.layoutId === config.roomLayout;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    const placementHadFocus = placementChoices.contains(document.activeElement);
    placementChoices.replaceChildren();
    const placementOptions = getPlacementOptions(config.roomLayout);
    placementSection.hidden = placementOptions.length < 2;
    let selectedPlacementButton: HTMLButtonElement | null = null;
    for (const option of placementOptions) {
      const button = document.createElement('button');
      const selected = option.value === config.placementTarget;
      const friendlyLabel = friendlyPlacementLabel(config.roomLayout, option.label);
      button.type = 'button';
      button.className = 'placement-choice';
      button.classList.toggle('is-selected', selected);
      button.dataset.placementTarget = option.value;
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected) selectedPlacementButton = button;
      button.innerHTML = `<span class="radio-dot" aria-hidden="true"><i></i></span><span>${escapeHtml(friendlyLabel)}</span>`;
      button.addEventListener('click', () => {
        const next = fitBookcasesToSelectedOpening({
          ...currentConfig,
          placementTarget: option.value,
        });
        currentConfig = next;
        callbacks.onConfigChange(next);
      });
      placementChoices.appendChild(button);
    }
    if (placementHadFocus && selectedPlacementButton) {
      requestAnimationFrame(() => selectedPlacementButton?.focus());
    }

    arrangeMeasurementFields(config);

    const activeSides = new Set(derived.bookcasePlacements.map((placement) => placement.sourceSide));
    setFieldVisibility(root, 'leftBookcaseWidth', activeSides.has('left'));
    setFieldVisibility(root, 'rightBookcaseWidth', activeSides.has('right'));
    setFieldLabel(root, 'leftBookcaseWidth', derived.bookcasePlacements.length === 1 ? 'Bookcase overall width' : 'Left overall width');
    setFieldLabel(root, 'rightBookcaseWidth', derived.bookcasePlacements.length === 1 ? 'Bookcase overall width' : 'Right overall width');
    const usesFeatureClearance = [
      'fireplace-wall',
      'window-wall',
      'door-wall',
      'offset-window-wall',
      'double-window-wall',
      'media-wall',
    ].includes(config.roomLayout);
    setFieldVisibility(root, 'centerGap', usesFeatureClearance);
    setFieldVisibility(root, 'showFire', derived.hasFireplace);

    const fireplaceGroup = root.querySelector<HTMLElement>('[data-control-group="fireplace"]');
    if (fireplaceGroup) fireplaceGroup.hidden = !derived.hasFireplace;
    const fireplaceView = root.querySelector<HTMLButtonElement>('[data-view="fireplace"]');
    const rightDetailView = root.querySelector<HTMLButtonElement>('[data-view="right-detail"]');
    const leftDetailView = root.querySelector<HTMLButtonElement>('[data-view="left-detail"]');
    if (fireplaceView) fireplaceView.hidden = !derived.hasFireplace;
    if (rightDetailView) rightDetailView.hidden = derived.bookcasePlacements.length < 2;
    if (rightDetailView) rightDetailView.textContent = 'Right bookcase';
    if (leftDetailView) leftDetailView.textContent = derived.bookcasePlacements.length < 2 ? 'Bookcase detail' : 'Left bookcase';

    root.querySelectorAll<HTMLButtonElement>('[data-cabinet-finish]').forEach((button) => {
      const selected = button.dataset.cabinetFinish === config.cabinetFinish;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll<HTMLButtonElement>('[data-measurement-confidence]').forEach((button) => {
      const selected = button.dataset.measurementConfidence === config.measurementConfidence;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });

    updateSourceCards(layoutOption, baseUrl, sourceNote, drawingCard, secondaryReferenceCard);
    updateWarnings(shell.warningPanel, derived);
    updateDerivedReadout(derivedReadout, derived);
    updateReviewSummary(root, config, derived);
  };

  const arrangeMeasurementFields = (config: ModelConfig): void => {
    const primaryKeys = new Set(PRIMARY_MEASUREMENT_KEYS[config.roomLayout]);
    const activeLayoutKeys = new Set<keyof ModelConfig>(getLayoutDimensionKeys(config.roomLayout));
    const sharedRoomKeys = new Set<keyof ModelConfig>(['roomWidth', 'roomDepth', 'roomHeight']);
    let secondaryCount = 0;

    for (const definition of MEASUREMENT_FIELDS) {
      const row = measurementRows.get(definition.key);
      if (!row) continue;
      const primary = primaryKeys.has(definition.key);
      const relevant = activeLayoutKeys.has(definition.key) || sharedRoomKeys.has(definition.key);
      const allowed = config.roomLayout === 'offset-alcove'
        ? !['roomWidth', 'roomDepth'].includes(String(definition.key))
        : true;
      if (primary && allowed) {
        primaryMeasurementFields.appendChild(row);
        row.hidden = false;
      } else if (relevant && allowed) {
        secondaryMeasurementFields.appendChild(row);
        row.hidden = false;
        secondaryCount += 1;
      } else {
        secondaryMeasurementFields.appendChild(row);
        row.hidden = true;
      }
    }

    secondaryMeasurements.hidden = secondaryCount === 0;
    if (secondaryCount === 0) secondaryMeasurements.open = false;
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

  setActiveStep(opensAtReview ? 4 : 1, false);
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

function layoutSchematic(layoutId: RoomLayoutId): string {
  const parts: Record<RoomLayoutId, string> = {
    'fireplace-wall': `
      <span class="room-diagram__cabinet room-diagram__cabinet--left"></span>
      <span class="room-diagram__fireplace"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--right"></span>`,
    'straight-wall': `
      <span class="room-diagram__clear-wall"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--center"></span>`,
    'window-wall': `
      <span class="room-diagram__cabinet room-diagram__cabinet--left"></span>
      <span class="room-diagram__window room-diagram__window--center"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--right"></span>`,
    'center-niche': `
      <span class="room-diagram__recess room-diagram__recess--center"></span>
      <span class="room-diagram__pier room-diagram__pier--left"></span>
      <span class="room-diagram__pier room-diagram__pier--right"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--center"></span>`,
    'offset-alcove': `
      <span class="room-diagram__alcove-back"></span>
      <span class="room-diagram__return room-diagram__return--left"></span>
      <span class="room-diagram__return room-diagram__return--right"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--wide"></span>`,
    'door-wall': `
      <span class="room-diagram__cabinet room-diagram__cabinet--left"></span>
      <span class="room-diagram__door room-diagram__door--center"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--right"></span>`,
    'offset-window-wall': `
      <span class="room-diagram__cabinet room-diagram__cabinet--left-wide"></span>
      <span class="room-diagram__window room-diagram__window--offset-right"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--right-narrow"></span>`,
    'double-window-wall': `
      <span class="room-diagram__window room-diagram__window--left"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--center-narrow"></span>
      <span class="room-diagram__window room-diagram__window--right"></span>`,
    'media-wall': `
      <span class="room-diagram__cabinet room-diagram__cabinet--left"></span>
      <span class="room-diagram__media"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--right"></span>`,
    'side-nook': `
      <span class="room-diagram__recess room-diagram__recess--left"></span>
      <span class="room-diagram__return room-diagram__return--nook"></span>
      <span class="room-diagram__pier room-diagram__pier--right-wide"></span>
      <span class="room-diagram__cabinet room-diagram__cabinet--nook-left"></span>`,
  };
  return `
    <span class="room-diagram room-diagram--${escapeHtml(layoutId)}" data-room-diagram="${escapeHtml(layoutId)}" aria-hidden="true">
      <span class="room-diagram__scene">
        <span class="room-diagram__wall"></span>
        ${parts[layoutId]}
        <span class="room-diagram__floor"></span>
      </span>
    </span>`;
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
    ? `<span class="source-badge is-supplied">Supplied</span><p>This room is based on an owner-provided image. Unlabeled dimensions are editable planning estimates.</p>`
    : `<span class="source-badge is-study">Common scenario</span><p>This room is a planning example. Replace its estimates with measurements or photos before a design is approved.</p>`;

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
    const valueColumn = document.createElement('span');
    valueColumn.className = 'field-value-column';
    const inputWrap = document.createElement('span');
    inputWrap.className = 'number-input-wrap';
    const numberInput = document.createElement('input');
    const acceptsFractions = MEASUREMENT_KEYS.has(definition.key);
    numberInput.type = acceptsFractions ? 'text' : 'number';
    if (acceptsFractions) {
      numberInput.inputMode = 'decimal';
      numberInput.autocomplete = 'off';
      numberInput.dataset.minimum = String(definition.min ?? '');
      numberInput.dataset.maximum = String(definition.max ?? '');
    } else {
      numberInput.min = String(definition.min ?? '');
      numberInput.max = String(definition.max ?? '');
      numberInput.step = String(definition.step ?? 0.125);
    }
    numberInput.value = String(config[definition.key]);
    numberInput.dataset.committedValue = numberInput.value;
    const commitValue = (): void => {
      const parsed = acceptsFractions
        ? parseImperialInput(numberInput.value)
        : numberInput.valueAsNumber;
      if (!Number.isFinite(parsed)) {
        numberInput.setAttribute('aria-invalid', 'true');
        updateMeasurementConversion(numberInput, Number.NaN, 'Enter a number, such as 67 1/2');
        return;
      }
      numberInput.removeAttribute('aria-invalid');
      const minimum = definition.min ?? Number.NEGATIVE_INFINITY;
      const maximum = definition.max ?? Number.POSITIVE_INFINITY;
      const nextValue = Math.min(maximum, Math.max(minimum, parsed));
      if (Number(numberInput.dataset.committedValue) === nextValue) return;
      numberInput.dataset.committedValue = String(nextValue);
      onChange(definition.key, nextValue);
    };
    numberInput.addEventListener('change', commitValue);
    if (acceptsFractions) numberInput.addEventListener('blur', commitValue);
    if (acceptsFractions) {
      numberInput.addEventListener('input', () => {
        numberInput.removeAttribute('aria-invalid');
        updateMeasurementConversion(numberInput, parseImperialInput(numberInput.value));
      });
    }
    numberInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') numberInput.blur();
    });
    inputWrap.appendChild(numberInput);
    const suffix = document.createElement('span');
    suffix.className = 'input-suffix';
    suffix.textContent = definition.suffix ?? 'in';
    inputWrap.appendChild(suffix);
    valueColumn.appendChild(inputWrap);
    if (acceptsFractions) {
      const conversion = document.createElement('small');
      conversion.className = 'inch-conversion';
      conversion.id = `measurement-feedback-${String(definition.key)}`;
      conversion.setAttribute('aria-live', 'off');
      numberInput.setAttribute('aria-describedby', conversion.id);
      valueColumn.appendChild(conversion);
      updateMeasurementConversion(numberInput, Number(config[definition.key]));
    }
    row.appendChild(valueColumn);
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
  help?: string,
): FieldDefinition {
  return { key, label, min, max, step, suffix, type: 'number', help };
}

function selectField(key: keyof ModelConfig, label: string, options: FieldDefinition['options']): FieldDefinition {
  return { key, label, options, type: 'select' };
}

function checkboxField(key: keyof ModelConfig, label: string): FieldDefinition {
  return { key, label, type: 'checkbox' };
}

export function parseImperialInput(rawValue: string): number {
  const normalized = rawValue
    .trim()
    .replaceAll('″', '')
    .replaceAll('"', '')
    .replace(/\s*in(?:ches)?\.?$/i, '')
    .replace(/(\d)\s*-\s*(\d+\s*\/\s*\d+)$/, '$1 $2');
  if (normalized === '') return Number.NaN;
  if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    return Number(normalized);
  }
  const match = normalized.match(/^([+-])?(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (!match) return Number.NaN;
  const denominator = Number(match[4]);
  if (denominator === 0) return Number.NaN;
  const sign = match[1] === '-' ? -1 : 1;
  const whole = Number(match[2] ?? 0);
  const fraction = Number(match[3]) / denominator;
  return sign * (whole + fraction);
}

export function formatFeetAndInches(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) < 12) return '';
  const sign = value < 0 ? '−' : '';
  const absolute = Math.round(Math.abs(value) * 16) / 16;
  const feet = Math.floor(absolute / 12);
  const remainingInches = absolute - feet * 12;
  const inches = remainingInches < 1 / 32
    ? ''
    : ` ${formatInches(remainingInches).replace('″', ' in')}`;
  return `${sign}${feet} ft${inches}`;
}

function updateMeasurementConversion(
  input: HTMLInputElement,
  value: number,
  invalidMessage = '',
): void {
  const conversion = input.closest<HTMLElement>('.field-value-column')
    ?.querySelector<HTMLElement>('.inch-conversion');
  if (!conversion) return;
  const formatted = formatFeetAndInches(value);
  conversion.textContent = invalidMessage || formatted || 'Inches';
  conversion.classList.toggle('is-placeholder', !invalidMessage && !formatted);
  conversion.classList.toggle('is-error', Boolean(invalidMessage));
  if (invalidMessage) {
    conversion.removeAttribute('aria-live');
    conversion.setAttribute('role', 'alert');
  } else {
    conversion.removeAttribute('role');
    conversion.setAttribute('aria-live', 'off');
  }
}

function updateWarnings(panel: HTMLElement, derived: DerivedLayout): void {
  const friendlyWarnings = getCustomerWarnings(derived);
  if (friendlyWarnings.length === 0) {
    panel.hidden = true;
    panel.innerHTML = '';
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <strong>${friendlyWarnings.length === 1 ? 'One thing' : `${friendlyWarnings.length} things`} to review</strong>
    ${friendlyWarnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join('')}
    <small>This is a planning preview. Final dimensions still need field verification.</small>
  `;
}

export function getCustomerWarnings(derived: DerivedLayout): string[] {
  return [...new Set(
    derived.structuralWarnings.map((warning) => friendlyWarning(warning)),
  )];
}

function friendlyWarning(warning: string): string {
  if (warning.includes('above the 36')) {
    return 'This shelf width needs extra support. The support detail must be reviewed before approval.';
  }
  if (warning.includes('below the 44″ minimum')) {
    return 'The selected opening is too narrow for this bookcase. It needs at least 44″ of clear width. Increase the opening or choose another placement.';
  }
  if (warning.includes('exceeds its selected installation opening')) {
    return 'The bookcase is wider than the selected space. Update the measurements, then build it again.';
  }
  if (warning.includes('projects beyond')) {
    return 'The base cabinet extends beyond the recessed wall. Confirm the intended front alignment.';
  }
  if (warning.includes('top filler')) {
    return 'There will be extra space above the bookcase. Adjust the overall height for a closer ceiling fit.';
  }
  return warning;
}

function updateDerivedReadout(readout: HTMLElement, derived: DerivedLayout): void {
  readout.classList.toggle('is-single', derived.bookcasePlacements.length === 1);
  required<HTMLElement>(readout, '[data-derived="opening-label"]').textContent = derived.selectedOpeningLabel;
  const openingWidths = derived.bookcasePlacements.map((placement) => placement.openingWidth);
  const unequalPair = openingWidths.length > 1 &&
    Math.max(...openingWidths) - Math.min(...openingWidths) > 1e-6;
  required<HTMLElement>(readout, '[data-derived="opening-width"]').textContent = unequalPair
    ? 'Varies by side'
    : formatInches(derived.selectedOpeningWidth);
  for (const index of [0, 1] as const) {
    const card = required<HTMLElement>(readout, `[data-derived-unit="${index}"]`);
    const placement = derived.bookcasePlacements[index];
    card.hidden = !placement;
    if (!placement) continue;
    const isLeft = placement.sourceSide === 'left';
    const supportRequired = isLeft ? derived.leftShelfSupportRequired : derived.rightShelfSupportRequired;
    required<HTMLElement>(card, `[data-derived="unit-${index}-label"]`).textContent =
      derived.bookcasePlacements.length === 1
        ? 'Bookcase'
        : placement.sourceSide === 'left' ? 'Left bookcase' : 'Right bookcase';
    required<HTMLElement>(card, `[data-derived="unit-${index}-width"]`).textContent = `${formatInches(placement.width)} wide`;
    const doesNotFit = placement.width > placement.openingWidth + 1e-6;
    required<HTMLElement>(card, `[data-derived="unit-${index}-note"]`).textContent = doesNotFit
      ? `Needs at least ${formatInches(placement.width)}`
      : supportRequired
        ? 'Extra shelf support needed'
        : `Fits within ${formatInches(placement.openingWidth)}`;
    card.classList.toggle('does-not-fit', doesNotFit);
  }
}

function updateReviewSummary(
  root: ParentNode,
  config: ModelConfig,
  derived: DerivedLayout,
): void {
  const placement = getPlacementOptions(config.roomLayout).find(
    (option) => option.value === config.placementTarget,
  );
  const finish = FINISH_OPTIONS.find((option) => option.value === config.cabinetFinish);
  const sizes = derived.bookcasePlacements
    .map((item) => formatInches(item.width))
    .join(' + ');
  required<HTMLElement>(root, '[data-review-room]').textContent = getRoomLayoutOption(config.roomLayout).label;
  required<HTMLElement>(root, '[data-review-placement]').textContent = placement
    ? friendlyPlacementLabel(config.roomLayout, placement.label)
    : derived.selectedOpeningLabel;
  required<HTMLElement>(root, '[data-review-size]').textContent = derived.bookcasePlacements.length > 1
    ? `Left ${formatInches(derived.bookcasePlacements[0].width)} + Right ${formatInches(derived.bookcasePlacements[1].width)} · ${formatInches(config.bookcaseHeight)} H`
    : `${sizes} W × ${formatInches(config.bookcaseHeight)} H`;
  required<HTMLElement>(root, '[data-review-finish]').textContent = finish?.label ?? 'Warm white';
  required<HTMLElement>(root, '[data-review-confidence]').textContent =
    config.measurementConfidence === 'measured' ? 'Measured by me' : 'Planning estimate';

  const status = required<HTMLElement>(root, '[data-review-status]');
  const note = required<HTMLElement>(root, '[data-review-status-note]');
  const card = required<HTMLElement>(root, '.review-card');
  const warningCount = getCustomerWarnings(derived).length;
  const hasWarnings = warningCount > 0;
  card.classList.toggle('has-warning', hasWarnings);
  status.textContent = hasWarnings ? 'Your planning preview needs review' : 'Your planning preview is ready';
  note.textContent = hasWarnings
    ? `See ${warningCount === 1 ? 'the design note' : `${warningCount} design notes`} on the 3D preview.`
    : 'It fits the measurements entered.';
}

function friendlyPlacementLabel(layout: RoomLayoutId, label: string): string {
  if (layout === 'side-nook') {
    return label.includes('left') ? 'Inside the left-side nook' : 'Inside the right-side nook';
  }
  return label.replace('study span', 'position');
}

function handleRadioGroupKeydown(
  event: KeyboardEvent,
  group: HTMLElement,
  selector: string,
): void {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
    return;
  }
  const options = [...group.querySelectorAll<HTMLButtonElement>(selector)]
    .filter((option) => !option.hidden && !option.disabled);
  if (options.length < 2) return;
  const currentIndex = options.indexOf(event.target as HTMLButtonElement);
  if (currentIndex < 0) return;
  event.preventDefault();
  let nextIndex = currentIndex;
  if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = options.length - 1;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIndex = (currentIndex - 1 + options.length) % options.length;
  } else {
    nextIndex = (currentIndex + 1) % options.length;
  }
  options[nextIndex].focus();
  options[nextIndex].click();
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
  await writeClipboardText(reviewShareUrl(config));
}

export async function copyProjectSummary(
  config: ModelConfig,
  derived: DerivedLayout,
): Promise<void> {
  const placement = getPlacementOptions(config.roomLayout).find(
    (option) => option.value === config.placementTarget,
  );
  const finish = FINISH_OPTIONS.find((option) => option.value === config.cabinetFinish);
  const sizes = derived.bookcasePlacements.length > 1
    ? `Left ${formatInches(derived.bookcasePlacements[0].width)} W + Right ${formatInches(derived.bookcasePlacements[1].width)} W × ${formatInches(config.bookcaseHeight)} H`
    : `${formatInches(derived.bookcasePlacements[0]?.width ?? 0)} W × ${formatInches(config.bookcaseHeight)} H`;
  const warnings = getCustomerWarnings(derived);
  const summary = [
    'Built-in Bookcase Planning Preview',
    '',
    'Design: Classic Shaker built-in',
    `Room: ${getRoomLayoutOption(config.roomLayout).label}`,
    `Placement: ${placement ? friendlyPlacementLabel(config.roomLayout, placement.label) : derived.selectedOpeningLabel}`,
    `Overall size: ${sizes}`,
    `Color: ${finish?.label ?? 'Warm white'}`,
    `Measurements: ${config.measurementConfidence === 'measured' ? 'Measured by me' : 'Planning estimate'}`,
    warnings.length > 0 ? `Review: ${warnings.join(' ')}` : 'Review: Fits the measurements entered.',
    '',
    'Planning preview only. Final dimensions and site conditions require field verification before approval.',
    `Open design: ${reviewShareUrl(config)}`,
  ].join('\n');
  await writeClipboardText(summary);
}

function reviewShareUrl(config: ModelConfig): string {
  const url = new URL(configToUrl(config));
  url.searchParams.set('step', 'review');
  return url.toString();
}

async function writeClipboardText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const field = document.createElement('textarea');
    field.value = value;
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
