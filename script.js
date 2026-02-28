document.addEventListener("DOMContentLoaded", () => {

    // UI Connections
    const progressFill = document.getElementById("progress-bar-fill");
    const progressText = document.getElementById("progress-text");
    const scarcityText = document.getElementById("scarcity-text");
    const introText = document.getElementById("intro-text");
    const secretToast = document.getElementById("secret-toast");
    const secretToastText = document.getElementById("secret-toast-text");
    const galleryHud = document.getElementById("gallery-hud");
    const testimonialHud = document.getElementById("testimonial-hud");

    // Modal Connections
    const modal = document.getElementById("modal");
    const modalContent = document.getElementById("modal-content");
    const btnEnterSanctuary = document.getElementById("enter-sanctuary");
    const btnCloseModal = document.getElementById("close-modal");
    const btnClaim = document.getElementById("claim-btn");

    const openModal = () => {
        modal.classList.remove("pointer-events-none", "opacity-0");
        modalContent.classList.remove("scale-95");
        modalContent.classList.add("scale-100");
    };

    const closeModal = () => {
        modal.classList.add("pointer-events-none", "opacity-0");
        modalContent.classList.add("scale-95");
        modalContent.classList.remove("scale-100");
    };

    [btnEnterSanctuary, secretToast].forEach(el => el.addEventListener("click", openModal));
    [btnCloseModal, btnClaim].forEach(el => el.addEventListener("click", closeModal));

    // Web Audio ASMR Hooks
    let audioCtx = null;
    let masterGain = null;

    const initAudio = () => {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(audioCtx.destination);
    };

    const playChime = (freq = 440) => {
        if (!audioCtx || !masterGain) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    };


    // 3D SCENE SETUP
    const container = document.getElementById('webgl-container');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#05000a");
    scene.fog = new THREE.FogExp2("#ff80b3", 0.015);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // Objects
    // A. Sanctuary Crystals
    const crystalGeo = new THREE.OctahedronGeometry(1, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xffb3d1,
        transmission: 0.9,
        opacity: 1,
        metalness: 0,
        roughness: 0.1,
        ior: 1.5,
        thickness: 0.5,
        specularIntensity: 1,
    });

    // Fallback if InstancedMesh properties are tricky across three.js versions: simply create a group
    const crystalGroup = new THREE.Group();
    for (let i = 0; i < 100; i++) {
        const mesh = new THREE.Mesh(crystalGeo, crystalMat);
        mesh.position.set(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            -Math.random() * 40
        );
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        const scale = Math.random() * 2 + 0.5;
        mesh.scale.set(scale, scale * 3, scale);
        crystalGroup.add(mesh);
    }
    scene.add(crystalGroup);

    // B. Levitation Bloom Particles
    const particleCount = 10000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particlePhase = new Float32Array(particleCount);
    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePos[i] = (Math.random() - 0.5) * 100;
        particlePos[i + 1] = (Math.random() - 0.5) * 100 - 20;
        particlePos[i + 2] = -30 - Math.random() * 100;
        particlePhase[i / 3] = Math.random() * Math.PI * 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    particleGeo.setAttribute('aPhase', new THREE.BufferAttribute(particlePhase, 1));

    const particleMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uColor: { value: new THREE.Color("#ff4d94") }
        },
        vertexShader: `
        uniform float uTime;
        attribute float aPhase;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + aPhase) * 2.0;
          pos.x += cos(uTime * 0.3 + aPhase) * 1.0;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (15.0 / -mvPosition.z);
          vAlpha = 0.5 + 0.5 * sin(uTime + aPhase);
        }
      `,
        fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          gl_FragColor = vec4(uColor, vAlpha * (1.0 - dist * 2.0));
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // C. Siren Depths Ocean Warping
    const oceanGeo = new THREE.PlaneGeometry(200, 200, 100, 100);
    const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x110022,
        emissive: 0x330044,
        roughness: 0.1,
        metalness: 0.8,
        wireframe: true
    });
    const oceanPlane = new THREE.Mesh(oceanGeo, oceanMat);
    oceanPlane.rotation.x = -Math.PI / 2;
    oceanPlane.position.set(0, -20, -100);
    scene.add(oceanPlane);

    // D. Cosmic Throne
    const throneGeo = new THREE.TorusGeometry(10, 0.5, 16, 100);
    const throneMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const throne = new THREE.Mesh(throneGeo, throneMat);
    throne.position.set(0, 5, -145);
    scene.add(throne);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xff80b3, 5, 50);
    scene.add(pointLight);


    // SCROLLING & TIMELINE
    const lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    let scrollProgress = 0;

    // Debounce flags for secrets
    let playedSecret1 = false;
    let playedSecret2 = false;

    lenis.on('scroll', (e) => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollProgress = maxScroll > 0 ? e.animatedScroll / maxScroll : 0;

        // Update UI Progress Bar
        progressFill.style.transform = \`translateX(-${100 - (scrollProgress * 100)}%)\`;
      progressText.innerText = \`Your Ascension: \${Math.floor(scrollProgress * 100)}%\`;

      // Update Scarcity Hook text
      if (scrollProgress < 0.2) scarcityText.innerText = "Initiating...";
      else if (scrollProgress < 0.45) scarcityText.innerText = "Only 3% Reach This Realm";
      else if (scrollProgress < 0.7) scarcityText.innerText = "Limited Elixir Stock";
      else scarcityText.innerText = "Ascension Imminent";

      // Fade Intro Text
      introText.style.opacity = scrollProgress < 0.05 ? "1" : "0";

      // Update Camera Z Depth (Move into scene)
      gsap.to(camera.position, {
        z: 10 - scrollProgress * 150,
        y: scrollProgress * 10,
        duration: 0.5,
        ease: "power2.out"
      });

      // Variable Rewards
      if (scrollProgress > 0.18 && scrollProgress < 0.22 && !playedSecret1) {
          playedSecret1 = true;
          playChime(880);
          showSecret("Secret Unlocked: Crystal Clarity");
      }
      if (scrollProgress > 0.48 && scrollProgress < 0.52 && !playedSecret2) {
          playedSecret2 = true;
          playChime(1200);
          showSecret("Secret Unlocked: Siren Voice");
      }
      if (scrollProgress < 0.1 || scrollProgress > 0.6) {
          // reset for replay factor
          playedSecret1 = false; playedSecret2 = false;
      }

      // Show/Hide Gallery HUD
      if (scrollProgress > 0.3 && scrollProgress < 0.8) {
          galleryHud.style.opacity = "1";
          // Parallax effect
          galleryHud.style.transform = \`translateY(\${(scrollProgress - 0.3) * -100}px)\`;
      } else {
          galleryHud.style.opacity = "0";
      }

      // Show Testimonials
      testimonialHud.style.opacity = (scrollProgress > 0.45 && scrollProgress < 0.7) ? "1" : "0";
    });

    let secretTimeout;
    const showSecret = (message) => {
        clearTimeout(secretTimeout);
        secretToastText.innerText = \`✨ \${message}\`;
        secretToast.classList.remove("opacity-0", "pointer-events-none");
        
        secretTimeout = setTimeout(() => {
            secretToast.classList.add("opacity-0", "pointer-events-none");
        }, 3000);
    }

    // INTERACTIONS
    let targetX = 0, targetY = 0;
    
    window.addEventListener("mousemove", (e) => {
      initAudio();
      const pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      const pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
      
      targetX = pointerX * 2;
      targetY = pointerY * 2;

      // Move point light to mouse
      gsap.to(pointLight.position, {
          x: pointerX * 15,
          y: pointerY * 15,
          z: camera.position.z - 5,
          duration: 0.5
      });
    });

    window.addEventListener("click", () => {
      initAudio();
      playChime(600 + Math.random() * 400); 
      // Emissive burst on click
      gsap.fromTo(crystalMat, 
        { emissiveIntensity: 2, emissive: new THREE.Color(0xffffff) },
        { emissiveIntensity: 0, duration: 1 }
      );
    });

    window.addEventListener("deviceorientation", (e) => {
        if (e.gamma && e.beta) {
            targetX = e.gamma / 45;
            targetY = (e.beta - 45) / 45;
        }
    });

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // RENDER LOOP
    const clock = new THREE.Clock();
    
    const tick = (time) => {
      const dt = clock.getElapsedTime();
      
      lenis.raf(time); // Important: pass the RAF timestamp

      // Shaders
      particleMat.uniforms.uTime.value = dt;

      // Animate ocean waves computationally
      const posAttr = oceanGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
          const u = oceanGeo.attributes.uv.getX(i);
          const v = oceanGeo.attributes.uv.getY(i);
          const z = Math.sin(u * 10 + dt) * 2 + Math.cos(v * 10 + dt * 0.8) * 2;
          posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      // Rotate objects
      crystalGroup.rotation.y = dt * 0.05;
      throne.rotation.x = Math.sin(dt) * 0.5;
      throne.rotation.y += 0.01;

      // Parallax camera rotation
      camera.rotation.y += (targetX * -0.1 - camera.rotation.y) * 0.05;
      camera.rotation.x += (targetY * 0.1 - camera.rotation.x) * 0.05;

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
});
