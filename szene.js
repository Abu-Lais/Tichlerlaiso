/** Interactive, intentionally schematic learning models. No machine settings are inferred. */
export async function mountScene(
  container,
  {
    kind = "project",
    exploded = false,
    onHotspot = () => {},
    savedView = null,
  } = {},
) {
  let disposed = false;
  const noop = () => {};
  const fallbackController = {
    dispose: () => {
      disposed = true;
      container.replaceChildren();
    },
    setKind: noop,
    setExploded: noop,
    capture: () => null,
    restore: noop,
    reset: noop,
    pause: noop,
  };
  const loading = document.createElement("p");
  loading.className = "scene-loading small muted";
  loading.textContent = "Dein Werkstück wird sichtbar …";
  container.replaceChildren(loading);
  let renderer;
  let cleanup = noop;
  try {
    const [THREE, { OrbitControls }] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
    ]);
    if (disposed) return fallbackController;
    const canvas = document.createElement("canvas");
    canvas.className = "scene-canvas";
    canvas.style.cssText =
      "display:block;width:100%;height:100%;touch-action:none;border-radius:inherit;";
    canvas.setAttribute("aria-label", "Drehbares 3D-Lernmodell");
    canvas.setAttribute("role", "img");
    const overlay = document.createElement("div");
    overlay.className = "scene-hotspots";
    overlay.style.cssText =
      "position:absolute;inset:0;pointer-events:none;overflow:hidden;border-radius:inherit;";
    container.style.position = "relative";
    container.replaceChildren(canvas, overlay);
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eaece5");
    scene.fog = new THREE.Fog("#eaece5", 12, 24);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 50);
    const controls = new OrbitControls(camera, canvas);
    controls.enablePan = false;
    controls.enableDamping = !window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    controls.dampingFactor = 0.12;
    controls.autoRotate = false;
    controls.minDistance = 3;
    controls.maxDistance = 11;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.minPolarAngle = 0.15;
    scene.add(new THREE.HemisphereLight("#ffffef", "#9ba99a", 2.4));
    const key = new THREE.DirectionalLight("#fff3dc", 3.5);
    key.position.set(-4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, {
      left: -5,
      right: 5,
      top: 5,
      bottom: -5,
      near: 0.1,
      far: 18,
    });
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 4;
    scene.add(key);
    const rim = new THREE.DirectionalLight("#edf8ff", 1.4);
    rim.position.set(4, 4, -3);
    scene.add(rim);

    const materials = [];
    const textures = [];
    const mat = (color, roughness = 0.65, metalness = 0) => {
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness,
      });
      materials.push(material);
      return material;
    };
    const green = mat("#244d40", 0.42, 0.18);
    const dark = mat("#172d29", 0.65, 0.15);
    const steel = mat("#b9c5c0", 0.36, 0.72);
    const alloy = mat("#d7ddd9", 0.45, 0.35);
    const black = mat("#323b37", 0.85);
    const orange = mat("#d18b50", 0.5);
    const wallMaterial = mat("#e2e5dc", 1);
    const woodSurface = document.createElement("canvas");
    woodSurface.width = 512;
    woodSurface.height = 256;
    const context = woodSurface.getContext("2d");
    context.fillStyle = "#d3ad76";
    context.fillRect(0, 0, 512, 256);
    for (let line = 0; line < 160; line++) {
      context.strokeStyle = line % 9 === 0 ? "#825833" : "#997141";
      context.globalAlpha = line % 7 === 0 ? 0.22 : 0.09;
      context.lineWidth = line % 6 === 0 ? 1.5 : 0.65;
      context.beginPath();
      for (let x = 0; x <= 512; x += 4) {
        const y =
          line * 1.72 +
          Math.sin(x / 65 + line / 13) * 2.2 +
          Math.sin(x / 22 + line / 18) * 0.7;
        if (!x) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }
    context.globalAlpha = 0.11;
    for (let ring = 0; ring < 9; ring++) {
      context.beginPath();
      context.ellipse(
        170,
        130,
        8 + ring * 6,
        2 + ring * 2,
        0.05,
        0,
        Math.PI * 2,
      );
      context.stroke();
    }
    const woodTexture = new THREE.CanvasTexture(woodSurface);
    woodTexture.colorSpace = THREE.SRGBColorSpace;
    woodTexture.anisotropy = Math.min(
      8,
      renderer.capabilities.getMaxAnisotropy(),
    );
    textures.push(woodTexture);
    const wood = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.78,
    });
    materials.push(wood);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      mat("#e8eae2", 1),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.035;
    ground.receiveShadow = true;
    scene.add(ground);

    let model = new THREE.Group();
    scene.add(model);
    let hotspots = [];
    let currentKind = kind;
    let currentExploded = exploded;
    let paused = false;
    let contextLost = false;
    let frame = 0;
    let dampingFrames = 0;
    let width = 1,
      height = 1;
    const geometries = new Set();
    function mesh(geometry, material, x, y, z, parent = model) {
      geometries.add(geometry);
      const object = new THREE.Mesh(geometry, material);
      object.position.set(x, y, z);
      object.castShadow = true;
      object.receiveShadow = true;
      parent.add(object);
      return object;
    }
    const box = (w, h, d, material, x = 0, y = 0, z = 0, parent = model) =>
      mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
    const cylinder = (
      radius,
      depth,
      material,
      x = 0,
      y = 0,
      z = 0,
      parent = model,
    ) =>
      mesh(
        new THREE.CylinderGeometry(radius, radius, depth, 48),
        material,
        x,
        y,
        z,
        parent,
      );
    function bolt(x, y, z, parent = model) {
      const item = cylinder(0.035, 0.018, steel, x, y, z, parent);
      item.rotation.x = Math.PI / 2;
      return item;
    }
    function hotspot(id, label, x, y, z) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "hotspot-button";
      button.style.cssText =
        "position:absolute;pointer-events:auto;transform:translate(-50%,-50%);white-space:nowrap;";
      button.textContent = String(hotspots.length + 1);
      button.title = label;
      button.setAttribute("aria-label", `${label} erklären`);
      button.addEventListener("click", () => {
        overlay
          .querySelectorAll("button")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        onHotspot(id);
      });
      overlay.append(button);
      hotspots.push({ point: new THREE.Vector3(x, y, z), button });
    }

    function makeProject() {
      const wall = box(7.5, 3.8, 0.08, wallMaterial, 0, 1.9, -0.29);
      wall.castShadow = false;
      const board = box(
        3.8,
        0.78,
        0.16,
        wood,
        0,
        1.75,
        currentExploded ? -0.04 : -0.15,
      );
      for (let i = 0; i < 5; i++) {
        const x = (i - 2) * 0.72;
        const hook = new THREE.Group();
        model.add(hook);
        hook.position.set(x, 1.6, currentExploded ? 0.7 : -0.04);
        box(0.17, 0.3, 0.1, wood, 0, 0.03, 0.04, hook);
        const shaft = box(0.17, 0.17, 0.64, wood, 0, 0.03, 0.32, hook);
        shaft.rotation.x = -0.22;
        const lip = box(0.17, 0.33, 0.13, wood, 0, 0.19, 0.6, hook);
        lip.rotation.x = -0.14;
        bolt(0, 0.11, 0.105, hook);
      }
      // Discrete reference lines suggest the crafted object without technical clutter.
      for (const x of [-1.68, 1.68]) bolt(x, 1.75, -0.057);
      if (currentExploded) {
        const lineMaterial = new THREE.LineDashedMaterial({
          color: "#8b9b8c",
          dashSize: 0.05,
          gapSize: 0.035,
          transparent: true,
          opacity: 0.5,
        });
        materials.push(lineMaterial);
        for (let i = 0; i < 5; i++) {
          const x = (i - 2) * 0.72;
          const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, 1.68, 0.08),
            new THREE.Vector3(x, 1.68, 0.7),
          ]);
          geometries.add(geometry);
          const line = new THREE.Line(geometry, lineMaterial);
          line.computeLineDistances();
          model.add(line);
        }
      }
      board.name = "Trägerbrett";
    }

    function makeSaw() {
      // A schematic sliding compound saw: deliberately no scale or adjustment values.
      box(3.6, 0.2, 2.2, dark, 0, 0.12, 0);
      box(3.25, 0.14, 1.8, alloy, 0, 0.29, 0);
      const turntable = cylinder(0.82, 0.08, steel, 0, 0.4, 0.05);
      box(0.055, 0.012, 1.35, dark, 0, 0.447, 0.05);
      box(3.1, 0.4, 0.12, green, 0, 0.55, -0.64);
      box(1.1, 0.06, 0.5, wood, -0.8, 0.49, 0.07);
      box(0.3, 1.1, 0.34, green, 0.05, 0.9, -0.92);
      const arm = box(0.22, 0.24, 1.25, dark, 0.05, 1.3, -0.38);
      arm.rotation.x = -0.35;
      const head = new THREE.Group();
      head.position.set(0.05, 1.43, 0.2);
      model.add(head);
      const blade = cylinder(0.63, 0.035, steel, 0, 0, 0, head);
      blade.rotation.z = Math.PI / 2;
      const hub = cylinder(0.14, 0.12, dark, 0.05, 0, 0, head);
      hub.rotation.z = Math.PI / 2;
      const shroud = mesh(
        new THREE.TorusGeometry(0.63, 0.075, 12, 48, Math.PI * 1.1),
        green,
        0,
        0,
        0,
        head,
      );
      shroud.rotation.y = Math.PI / 2;
      shroud.rotation.z = -0.12;
      box(0.46, 0.35, 0.6, green, -0.28, 0.17, -0.1, head);
      const handle = mesh(
        new THREE.TorusGeometry(0.2, 0.055, 8, 20, Math.PI),
        black,
        -0.12,
        0.6,
        0.16,
        head,
      );
      handle.rotation.y = Math.PI / 2;
      box(0.1, 0.13, 0.13, orange, -0.12, 0.57, 0.35, head);
      hotspot("table", "Auflage", -1.2, 0.45, 0.7);
      hotspot("guard", "Schutzhaube", 0.02, 1.93, 0.24);
      hotspot("stop", "Anschlag", 1.12, 0.79, -0.62);
      turntable.name = "Werkstückauflage";
    }

    function makeJointer() {
      box(2.8, 0.85, 1.15, green, 0, 0.5, 0);
      box(2.6, 0.1, 1.08, dark, 0, 0.08, 0);
      box(1.85, 0.13, 1.45, steel, -1.02, 1.01, 0);
      box(1.85, 0.13, 1.45, steel, 1.02, 1.01, 0);
      box(0.18, 0.1, 1.42, dark, 0, 1.015, 0);
      box(2.9, 0.56, 0.09, alloy, 0.05, 1.36, -0.52);
      box(0.13, 0.09, 1.1, green, 0.04, 1.14, 0.18);
      box(0.48, 0.09, 0.16, orange, 0.17, 1.17, 0.68);
      box(1.15, 0.09, 0.34, wood, -0.82, 1.12, 0.02);
      for (const x of [-0.9, 0.9]) {
        const wheel = mesh(
          new THREE.TorusGeometry(0.14, 0.025, 8, 20),
          black,
          x,
          0.6,
          0.6,
        );
        wheel.rotation.x = 0;
        box(0.04, 0.04, 0.12, steel, x, 0.6, 0.61);
      }
      box(0.22, 0.38, 0.07, dark, 1.05, 0.7, 0.62);
      cylinder(0.06, 0.035, orange, 1.05, 0.75, 0.67).rotation.x = Math.PI / 2;
      hotspot("table", "Tischflächen", -1.25, 1.1, 0.5);
      hotspot("fence", "Fügeanschlag", 1.05, 1.55, -0.45);
      hotspot("guard", "Messerwellenschutz", 0.02, 1.21, 0.52);
    }

    function makeThicknesser() {
      box(2.15, 0.18, 1.72, dark, 0, 0.12, 0);
      for (const x of [-0.83, 0.83]) {
        box(0.4, 1.45, 1.55, green, x, 0.92, 0);
        cylinder(0.055, 1.12, steel, x * 0.8, 1, 0.47);
      }
      box(2.05, 0.48, 1.5, green, 0, 1.62, -0.04);
      box(1.42, 0.12, 2.1, steel, 0, 0.62, 0.08);
      box(0.75, 0.16, 2.2, wood, 0, 0.77, 0.57);
      box(1.35, 0.13, 0.12, black, 0, 1.08, 0.71);
      box(1.35, 0.12, 0.14, black, 0, 1.1, -0.65);
      const wheel = mesh(
        new THREE.TorusGeometry(0.24, 0.04, 10, 32),
        black,
        1.1,
        1.07,
        0.45,
      );
      wheel.rotation.y = Math.PI / 2;
      const spoke = cylinder(0.04, 0.47, steel, 1.1, 1.07, 0.45);
      spoke.rotation.x = Math.PI / 2;
      cylinder(0.045, 0.23, orange, 1.2, 1.3, 0.45).rotation.z = Math.PI / 2;
      box(0.53, 0.18, 0.04, dark, 0.48, 1.65, 0.735);
      box(0.1, 0.1, 0.045, orange, 0.8, 1.65, 0.76);
      hotspot("table", "Dickentisch", -0.52, 0.6, 1.02);
      hotspot("height", "Höhenverstellung", 1.1, 1.14, 0.5);
      hotspot("feed", "Einzug", -0.05, 1.12, 0.8);
    }

    function makeDrill() {
      const group = new THREE.Group();
      model.add(group);
      group.rotation.y = -0.18;
      box(0.9, 0.24, 0.76, black, 0.28, 0.22, 0, group);
      box(0.7, 0.18, 0.63, green, 0.28, 0.39, 0, group);
      const grip = box(0.33, 1, 0.45, green, 0.3, 0.95, 0, group);
      grip.rotation.z = -0.13;
      const rubber = box(0.34, 0.69, 0.06, black, 0.35, 0.93, 0.23, group);
      rubber.rotation.z = -0.13;
      box(0.21, 0.19, 0.22, orange, 0.02, 1.17, 0.04, group);
      const body = cylinder(0.35, 1.02, green, 0, 1.5, 0, group);
      body.rotation.z = Math.PI / 2;
      const collar = cylinder(0.29, 0.23, dark, -0.6, 1.5, 0, group);
      collar.rotation.z = Math.PI / 2;
      const chuck = cylinder(0.22, 0.36, black, -0.88, 1.5, 0, group);
      chuck.rotation.z = Math.PI / 2;
      const bit = cylinder(0.034, 0.65, steel, -1.38, 1.5, 0, group);
      bit.rotation.z = Math.PI / 2;
      const end = cylinder(0.3, 0.08, dark, 0.55, 1.5, 0, group);
      end.rotation.z = Math.PI / 2;
      for (let i = 0; i < 5; i++)
        box(0.025, 0.18, 0.014, black, 0.31 - i * 0.09, 1.53, 0.343, group);
      box(0.24, 0.06, 0.17, black, -0.05, 1.85, 0, group);
      const block = box(2.5, 0.25, 1.5, wood, -0.12, 0.09, 0.02);
      block.position.y = -0.02;
      hotspot("chuck", "Bohrfutter", -0.88, 1.53, 0.16);
      hotspot("mode", "Funktionswahl", -0.42, 1.78, 0.08);
      hotspot("trigger", "Schalter", 0.06, 1.17, 0.26);
    }

    function freeModel() {
      scene.remove(model);
      for (const geometry of geometries) geometry.dispose();
      geometries.clear();
      model = new THREE.Group();
      scene.add(model);
      overlay.replaceChildren();
      hotspots = [];
    }
    function reset() {
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      if (currentKind === "project") {
        camera.position.set(5.1, 3.4, 7.4);
        controls.target.set(0, 1.75, 0.1);
      } else if (currentKind === "drill") {
        camera.position.set(-3.5, 2.8, 5.8);
        controls.target.set(-0.25, 0.95, 0);
      } else {
        camera.position.set(4.6, 3.5, 6.1);
        controls.target.set(0, 0.85, 0);
      }
      controls.update();
      controls.enableDamping = damping;
      invalidate();
    }
    function build(nextKind, preserveCamera = false) {
      currentKind = [
        "project",
        "saw",
        "jointer",
        "thickness",
        "drill",
      ].includes(nextKind)
        ? nextKind
        : "project";
      freeModel();
      ({
        project: makeProject,
        saw: makeSaw,
        jointer: makeJointer,
        thickness: makeThicknesser,
        drill: makeDrill,
      })[currentKind]();
      canvas.setAttribute(
        "aria-label",
        currentKind === "project"
          ? "Drehbares 3D-Modell des Kleidungshalters mit fünf Holzhaken"
          : "Schematisches Maschinen-Lernmodell mit drei beschrifteten Punkten",
      );
      if (!preserveCamera) reset();
      invalidate();
    }
    const projected = new THREE.Vector3();
    const direction = new THREE.Vector3();
    function render() {
      frame = 0;
      if (disposed || contextLost || document.hidden) return;
      if (!paused) controls.update();
      renderer.render(scene, camera);
      camera.getWorldDirection(direction);
      for (const item of hotspots) {
        projected.copy(item.point).project(camera);
        const visible =
          projected.z > -1 &&
          projected.z < 1 &&
          Math.abs(projected.x) < 1.1 &&
          Math.abs(projected.y) < 1.1;
        item.button.hidden = !visible;
        if (visible) {
          item.button.style.left = `${(projected.x * 0.5 + 0.5) * width}px`;
          item.button.style.top = `${(-projected.y * 0.5 + 0.5) * height}px`;
        }
      }
      if (!paused && dampingFrames > 0) {
        dampingFrames--;
        invalidate();
      }
    }
    function invalidate() {
      if (!disposed && !contextLost && !frame && !document.hidden)
        frame = requestAnimationFrame(render);
    }
    function resize() {
      const bounds = container.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height || 360);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      invalidate();
    }
    function onChange() {
      invalidate();
    }
    function onInteraction() {
      dampingFrames = 30;
      invalidate();
    }
    function onVisibility() {
      if (!document.hidden) invalidate();
    }
    controls.addEventListener("change", onChange);
    controls.addEventListener("start", onInteraction);
    controls.addEventListener("end", onInteraction);
    document.addEventListener("visibilitychange", onVisibility);
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const lost = (event) => {
      event.preventDefault();
      contextLost = true;
      controls.enabled = false;
      if (frame) cancelAnimationFrame(frame);
      const message = document.createElement("p");
      message.className = "scene-fallback small";
      message.textContent =
        "Die 3D-Ansicht wurde unterbrochen. Deine Inhalte bleiben verfügbar. Öffne diese Ansicht erneut.";
      overlay.replaceChildren(message);
    };
    canvas.addEventListener("webglcontextlost", lost);
    cleanup = () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", lost);
      controls.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      ground.geometry.dispose();
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
      container.replaceChildren();
    };
    build(kind);
    if (savedView) restore(savedView);
    resize();

    function restore(view) {
      if (
        !view ||
        !["position", "target"].every(
          (key) =>
            Array.isArray(view[key]) &&
            view[key].length === 3 &&
            view[key].every((n) => Number.isFinite(n) && Math.abs(n) < 100),
        )
      )
        return false;
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      camera.position.fromArray(view.position);
      controls.target.fromArray(view.target);
      controls.update();
      controls.enableDamping = damping;
      invalidate();
      return true;
    }
    return {
      dispose: cleanup,
      setKind: (value) => {
        if (!disposed) build(value);
      },
      setExploded: (value) => {
        currentExploded = Boolean(value);
        if (!disposed && currentKind === "project") build("project", true);
      },
      capture: () =>
        disposed
          ? null
          : {
              position: camera.position.toArray(),
              target: controls.target.toArray(),
            },
      restore,
      reset,
      pause: (value) => {
        paused = Boolean(value);
        controls.enabled = !paused;
        if (paused) dampingFrames = 0;
        invalidate();
      },
    };
  } catch (error) {
    cleanup();
    renderer?.dispose();
    container.innerHTML = `<div class="scene-fallback" style="height:100%;min-height:280px;display:grid;place-content:center;text-align:center;padding:24px;background:#e9ece3;border-radius:inherit"><svg viewBox="0 0 240 130" width="240" height="130" role="img" aria-label="Kleidungshalter mit fünf Haken" style="max-width:100%;margin:auto"><rect x="20" y="25" width="200" height="42" rx="3" fill="#c9a16d"/><path d="M26 35h188M26 49h188M26 58h188" stroke="#9d774a" opacity=".4"/><g fill="#b88a57"><path d="M43 54h10v39H43zM48 87h20v10H48z"/><path d="M78 54h10v39H78zM83 87h20v10H83z"/><path d="M113 54h10v39h-10zM118 87h20v10h-20z"/><path d="M148 54h10v39h-10zM153 87h20v10h-20z"/><path d="M183 54h10v39h-10zM188 87h20v10h-20z"/></g></svg><p style="font-size:14px;color:#3b5144;max-width:300px">Die 3D-Ansicht ist gerade nicht verfügbar. Du kannst mit allen Erklärungen weiterarbeiten.</p></div>`;
    return {
      ...fallbackController,
      error: "Die 3D-Ansicht konnte nicht gestartet werden.",
    };
  }
}
