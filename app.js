// Buildless ES module. Serve this folder over HTTP(S), e.g. python -m http.server.
// Three.js and OrbitControls use the same pinned version in index.html's import map.
const $ = (id) => document.getElementById(id);
const storageKey = 'meisterbegleiter:kleidungshalter:v1';
const ui = {
  title: $('project-title'), count: $('step-count'), step: $('step-title'),
  goal: $('step-goal'), detail: $('step-detail'), note: $('step-note'),
  previous: $('previous-step'), next: $('next-step'), remember: $('remember-button'),
  resume: $('resume-button'), saveStatus: $('save-status'), dataStatus: $('data-status'),
  sceneStatus: $('scene-status'), reset: $('reset-view'), canvas: $('scene-canvas'),
};
let project;
let stepIndex = 0;
let notes = {};
let paused = false;
let savedView = null;
let sceneController = null;

function validView(view) {
  return view && ['position', 'target'].every((key) =>
    Array.isArray(view[key]) && view[key].length === 3 &&
    view[key].every((value) => Number.isFinite(value) && Math.abs(value) < 10000));
}

function renderStep() {
  const step = project.schritte[stepIndex];
  ui.title.textContent = project.projekt;
  ui.count.textContent = `Schritt ${stepIndex + 1} von ${project.schritte.length}`;
  ui.step.textContent = step.titel;
  ui.goal.textContent = step.ziel;
  ui.detail.textContent = step.hinweis || '';
  ui.note.value = notes[step.id] || '';
  ui.previous.disabled = paused || stepIndex === 0;
  ui.next.disabled = paused || stepIndex === project.schritte.length - 1;
  ui.note.disabled = paused;
  ui.remember.disabled = paused;
  ui.remember.hidden = paused;
  ui.resume.hidden = !paused;
  ui.reset.disabled = paused || !sceneController;
  ui.count.textContent += paused ? ' · Pause' : '';
  if (sceneController) sceneController.setPaused(paused);
}

function persist(announce = false) {
  if (!project) return;
  if (sceneController) savedView = sceneController.capture();
  const savedAt = new Date().toISOString();
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      schemaVersion: 1, projectId: project.id,
      stepId: project.schritte[stepIndex].id, notes,
      view: savedView, paused, savedAt,
    }));
    if (announce) {
      const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit' }).format(new Date(savedAt));
      ui.saveStatus.textContent = `Stand um ${time} auf diesem Gerät gespeichert. Hier kannst du weitermachen.`;
    }
    return true;
  } catch {
    ui.saveStatus.textContent = 'Speichern im Browser ist gerade nicht möglich. Dein Stand bleibt bis zum Schließen dieser Seite erhalten.';
    return false;
  }
}

function restore() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved || saved.schemaVersion !== 1 || saved.projectId !== project.id) throw new Error('Unknown snapshot');
    const index = project.schritte.findIndex((step) => step.id === saved.stepId);
    if (index < 0) throw new Error('Unknown step');
    stepIndex = index;
    notes = Object.fromEntries(project.schritte.map((step) => [step.id,
      typeof saved.notes?.[step.id] === 'string' ? saved.notes[step.id].slice(0, 1000) : '',
    ]));
    savedView = validView(saved.view) ? saved.view : null;
    paused = true;
    ui.saveStatus.textContent = 'Dein letzter Stand ist wieder da. Mit „Hier weitermachen“ setzt du fort.';
  } catch {
    ui.saveStatus.textContent = 'Der gespeicherte Stand ist nicht verfügbar. Du kannst mit Schritt 1 beginnen.';
  }
}

function changeStep(offset) {
  if (!project || paused) return;
  const next = Math.max(0, Math.min(project.schritte.length - 1, stepIndex + offset));
  if (next === stepIndex) return;
  stepIndex = next;
  renderStep();
  persist();
  ui.step.focus();
}

ui.previous.addEventListener('click', () => changeStep(-1));
ui.next.addEventListener('click', () => changeStep(1));
ui.note.addEventListener('input', () => {
  if (!project || paused) return;
  notes[project.schritte[stepIndex].id] = ui.note.value;
  persist();
});
ui.remember.addEventListener('click', () => {
  if (!project) return;
  paused = true;
  persist(true);
  renderStep();
  ui.resume.focus();
});
ui.resume.addEventListener('click', () => {
  paused = false;
  renderStep();
  ui.saveStatus.textContent = 'Weiter geht’s – dein Schritt und deine Merkhilfe sind bereit.';
  persist();
  ui.step.focus();
});
ui.reset.addEventListener('click', () => {
  if (paused || !sceneController) return;
  sceneController.reset();
  persist();
});
window.addEventListener('pagehide', () => persist());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) persist();
});

async function loadProject() {
  try {
    const response = await fetch(new URL('./projekt_daten.json', import.meta.url));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.schemaVersion !== 1 || typeof data.id !== 'string' || typeof data.projekt !== 'string' ||
      !Array.isArray(data.schritte) || !data.schritte.length ||
      !data.schritte.every((s) => s && ['id', 'titel', 'ziel'].every((key) => typeof s[key] === 'string')) ||
      new Set(data.schritte.map((s) => s.id)).size !== data.schritte.length) {
      throw new Error('Invalid project data');
    }
    project = data;
    restore();
    renderStep();
    ui.dataStatus.textContent = '';
  } catch (error) {
    ui.dataStatus.textContent = 'Die Projektschritte konnten nicht geladen werden. Bitte öffne die App über einen Webserver und lade die Seite erneut.';
    ui.dataStatus.classList.add('is-error');
    ui.step.textContent = 'Projekt noch nicht verfügbar';
    ui.goal.textContent = 'Bitte prüfe die Verbindung und lade die Seite erneut.';
    console.error('Projekt laden:', error);
  }
}

async function initScene() {
  ui.reset.disabled = true;
  try {
    const [THREE, { OrbitControls }] = await Promise.all([
      import('three'), import('three/addons/controls/OrbitControls.js'),
    ]);
    const renderer = new THREE.WebGLRenderer({ canvas: ui.canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e5dd');
    scene.fog = new THREE.Fog('#e9e5dd', 13, 32);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
    const controls = new OrbitControls(camera, renderer.domElement);
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    controls.enableDamping = !motionPreference.matches;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.autoRotate = false;
    motionPreference.addEventListener('change', (event) => { controls.enableDamping = !event.matches; });

    scene.add(new THREE.HemisphereLight('#fff7e5', '#737768', 2.3));
    const key = new THREE.DirectionalLight('#fff4df', 3.5);
    key.position.set(-3, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5;
    key.shadow.camera.right = 5;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -5;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.normalBias = 0.025;
    key.shadow.bias = -0.0001;
    key.shadow.radius = 4;
    scene.add(key);
    const fill = new THREE.DirectionalLight('#e5efff', 1.4);
    fill.position.set(4, 3, -3);
    scene.add(fill);

    // Deterministic, locally generated grain: no texture downloads are required.
    function woodTexture(base, grain) {
      const surface = document.createElement('canvas');
      surface.width = surface.height = 256;
      const ctx = surface.getContext('2d');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = grain;
      for (let line = 0; line < 100; line++) {
        ctx.globalAlpha = 0.1 + (line % 5) * 0.025;
        ctx.lineWidth = line % 6 === 0 ? 1.2 : 0.5;
        ctx.beginPath();
        for (let x = 0; x <= 256; x += 4) {
          const y = line * 2.7 + Math.sin(x / 40 + line * 0.19) * 2.2;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      const texture = new THREE.CanvasTexture(surface);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }

    const benchMaterial = new THREE.MeshStandardMaterial({ map: woodTexture('#ae8056', '#513820'), roughness: 0.85 });
    const bench = new THREE.Mesh(new THREE.BoxGeometry(6, 0.24, 3.6), benchMaterial);
    bench.position.y = -0.12;
    bench.receiveShadow = true;
    bench.castShadow = true;
    scene.add(bench);
    const legMaterial = new THREE.MeshStandardMaterial({ color: '#4d574c', roughness: 0.9 });
    for (const x of [-2.35, 2.35]) {
      for (const z of [-1.25, 1.25]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 0.22), legMaterial);
        leg.position.set(x, -0.89, z);
        leg.castShadow = true;
        scene.add(leg);
      }
    }
    const wood = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 1.15, 1.15),
      new THREE.MeshStandardMaterial({ map: woodTexture('#d8b07b', '#81562f'), roughness: 0.86 }),
    );
    wood.position.y = 0.575;
    wood.rotation.y = 0.15;
    wood.castShadow = true;
    wood.receiveShadow = true;
    wood.name = 'Rohholz-Platzhalter';
    scene.add(wood);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({ color: '#e2ddd3', roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    scene.add(floor);

    function reset() {
      // Clear leftover orbit momentum when restoring the intended view.
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      camera.position.set(4.5, 3.6, 5.8);
      controls.target.set(0, 0.35, 0);
      controls.update();
      controls.enableDamping = damping;
    }
    reset();
    if (validView(savedView)) {
      camera.position.fromArray(savedView.position);
      controls.target.fromArray(savedView.target);
      controls.update();
    }
    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.clearViewOffset();
      // Keep the model visible beside the desktop card / above the mobile card.
      if (width > 700) camera.setViewOffset(width, height, -width * 0.15, 0, width, height);
      else camera.setViewOffset(width, height, 0, height * 0.18, width, height);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);
    sceneController = {
      capture: () => ({ position: camera.position.toArray(), target: controls.target.toArray() }),
      setPaused: (value) => { controls.enabled = !value; },
      reset,
    };
    controls.enabled = !paused;
    controls.addEventListener('end', () => persist());
    ui.reset.disabled = paused;
    ui.sceneStatus.textContent = 'Mit einem Finger drehen · Mit zwei Fingern zoomen';
    ui.canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      renderer.setAnimationLoop(null);
      ui.sceneStatus.textContent = 'Die 3D-Ansicht wurde unterbrochen. Bitte lade die Seite erneut. Dein Projektstand bleibt nutzbar.';
      ui.sceneStatus.classList.add('is-error');
    });
    renderer.setAnimationLoop(() => {
      if (document.hidden) return;
      if (!paused) controls.update();
      renderer.render(scene, camera);
    });
  } catch (error) {
    ui.sceneStatus.textContent = 'Die 3D-Ansicht ist gerade nicht verfügbar. Prüfe Internetverbindung und WebGL-Unterstützung. Deine Projektschritte bleiben nutzbar.';
    ui.sceneStatus.classList.add('is-error');
    console.error('3D-Ansicht:', error);
  }
}

// Project data and local notes remain usable even when the CDN or WebGL fails.
await loadProject();
await initScene();
