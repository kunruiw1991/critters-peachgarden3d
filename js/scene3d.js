import * as THREE from '../models/three.module.min.js';
import { CloudOxModel } from '../models/cloud_ox_model.js';
import { buildCatNapPlushModel } from '../models/catnap_model.js';
import { buildDogDayPlushModel } from '../models/dogday_model.js';
import { buildHoppyHopscotchPlushModel } from '../models/hoppy_hopscotch_model.js';
import { buildCraftyCornPlushModel } from '../models/craftycorn_model.js';
import { buildBubbaBubbaphantPlushModel } from '../models/bubba_bubbaphant_model.js';
import { buildPickyPiggyPlushModel } from '../models/picky_piggy_model.js';
import { buildKickinChickenPlushModel } from '../models/kickin_chicken_model.js';
import { buildBobbyBearHugPlushModel } from '../models/bobby_bearhug_model.js';
import { buildBabaChopsPlushModel } from '../models/baba_chops_model.js';

/**
 * 3D Scene Engine for Critter Peach Garden 3D.
 * Enforces non-IBL material hygiene (metalness <= 0.22).
 */
export class Scene3D {
  constructor(canvasContainer) {
    this.container = canvasContainer;
    this.width = canvasContainer.clientWidth || 1280;
    this.height = canvasContainer.clientHeight || 800;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xF5EBDC);

    // Camera setup (angled storybook isometric perspective)
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 5.8, 8.4);
    this.camera.lookAt(0, 1.2, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.container.appendChild(this.renderer.domElement);

    // Raycaster for 3D interactions
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Data containers
    this.peaches = [];
    this.mounds = [];
    this.visitorSlots = [];
    this.particles = [];

    this.initLights();
    this.buildGardenBed();
    this.buildPeachTree();
    this.buildSoilMounds();
    this.buildCloudOx();
    this.buildInteractiveTools();
    this.buildVisitorSteppingStones();

    this.enforceMaterialHygiene();

    window.addEventListener('resize', () => this.onResize());
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xFFF6E6, 0x8D9E78, 1.35);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xFFEAA7, 2.4);
    this.dirLight.position.set(5.5, 9.0, 5.0);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 25;
    this.dirLight.shadow.camera.left = -6;
    this.dirLight.shadow.camera.right = 6;
    this.dirLight.shadow.camera.top = 6;
    this.dirLight.shadow.camera.bottom = -6;
    this.scene.add(this.dirLight);

    this.treeGlow = new THREE.PointLight(0xFFB570, 0.8, 8, 1.5);
    this.treeGlow.position.set(0.6, 2.8, -0.2);
    this.scene.add(this.treeGlow);
  }

  buildGardenBed() {
    // Ground Turf Base
    const groundGeo = new THREE.CylinderGeometry(6.5, 7.2, 0.8, 36);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x8EB86D,
      roughness: 0.85,
      metalness: 0.05
    });
    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.position.set(0, -0.4, 0);
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);

    // Stone Garden Curb
    const curbGeo = new THREE.TorusGeometry(5.8, 0.22, 12, 36);
    curbGeo.rotateX(Math.PI * 0.5);
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0xDCD5C6,
      roughness: 0.75,
      metalness: 0.08
    });
    const curbMesh = new THREE.Mesh(curbGeo, curbMat);
    curbMesh.position.y = 0.04;
    this.scene.add(curbMesh);

    // Front Wooden Work Desk (where tools sit)
    const deskGeo = new THREE.BoxGeometry(7.2, 0.45, 1.8);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0xD4A373,
      roughness: 0.7,
      metalness: 0.08
    });
    const deskMesh = new THREE.Mesh(deskGeo, deskMat);
    deskMesh.position.set(0, 0.15, 2.8);
    deskMesh.receiveShadow = true;
    deskMesh.castShadow = true;
    this.scene.add(deskMesh);

    // River Stone Pathway
    [-1.8, 0, 1.8].forEach((x, i) => {
      const stoneGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.12, 16);
      stoneGeo.scale(1.1, 1.0, 0.9);
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 0xE6DFD3,
        roughness: 0.8,
        metalness: 0.05
      });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(x, 0.02, 1.25);
      stone.receiveShadow = true;
      this.scene.add(stone);
    });
  }

  buildPeachTree() {
    this.treeGroup = new THREE.Group();
    this.treeGroup.position.set(0.7, 0, -0.3);

    // Gnarled ancient bonsai trunk
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.25, 0.9, -0.1),
      new THREE.Vector3(0.18, 1.7, 0.15),
      new THREE.Vector3(-0.15, 2.5, -0.05),
      new THREE.Vector3(0.1, 3.1, 0)
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 24, 0.32, 14, false);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5C4033,
      roughness: 0.88,
      metalness: 0.06
    });
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    this.treeGroup.add(trunkMesh);

    // Foliage Clouds (peach blossoms)
    const blossomMat = new THREE.MeshStandardMaterial({
      color: 0xFFAEC9,
      roughness: 0.65,
      metalness: 0.04
    });
    const greenLeafMat = new THREE.MeshStandardMaterial({
      color: 0x7BC676,
      roughness: 0.75,
      metalness: 0.04
    });

    const foliagePositions = [
      [-0.8, 2.8, -0.4, 0.85, blossomMat],
      [ 0.9, 2.9,  0.2, 0.95, blossomMat],
      [-0.1, 3.4,  0.1, 1.10, blossomMat],
      [ 0.6, 3.2, -0.6, 0.80, greenLeafMat],
      [-0.6, 2.3,  0.3, 0.70, greenLeafMat]
    ];

    foliagePositions.forEach(([x, y, z, s, mat]) => {
      const geo = new THREE.DodecahedronGeometry(s, 2);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      this.treeGroup.add(mesh);
    });

    // 4 Hanging Peaches
    const peachCoords = [
      [-0.75, 2.25,  0.45],
      [ 0.75, 2.35,  0.35],
      [-0.20, 2.70,  0.65],
      [ 0.40, 2.85, -0.30]
    ];

    peachCoords.forEach((coords, i) => {
      const peachGroup = new THREE.Group();
      peachGroup.position.set(...coords);
      peachGroup.userData = { id: `peach_${i}`, index: i, state: 'RIPE', growth: 1.0 };

      // Plump peach body (overlapping squishy spheres)
      const pMat = new THREE.MeshStandardMaterial({
        color: 0xFF8595,
        roughness: 0.45,
        metalness: 0.10,
        emissive: 0x441118
      });
      const pGeoL = new THREE.SphereGeometry(0.24, 16, 14);
      pGeoL.scale(0.9, 1.1, 0.9);
      const meshL = new THREE.Mesh(pGeoL, pMat);
      meshL.position.x = -0.06;

      const pGeoR = new THREE.SphereGeometry(0.24, 16, 14);
      pGeoR.scale(0.9, 1.1, 0.9);
      const meshR = new THREE.Mesh(pGeoR, pMat);
      meshR.position.x = 0.06;

      // Stem & Leaf
      const stemGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.12, 8);
      const stemMat = new THREE.MeshStandardMaterial({ color: 0x4A2E18, roughness: 0.8, metalness: 0.05 });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.y = 0.24;

      const leafGeo = new THREE.SphereGeometry(0.08, 10, 8);
      leafGeo.scale(1.8, 0.3, 0.8);
      const leafMesh = new THREE.Mesh(leafGeo, greenLeafMat);
      leafMesh.position.set(0.08, 0.23, 0.02);
      leafMesh.rotation.z = -0.4;

      // Golden Halo Ring (for ripe state)
      const haloGeo = new THREE.TorusGeometry(0.34, 0.022, 10, 24);
      const haloMat = new THREE.MeshStandardMaterial({
        color: 0xFFDF73,
        roughness: 0.3,
        metalness: 0.20,
        emissive: 0x664400
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.rotation.x = Math.PI * 0.5;
      haloMesh.name = 'halo';

      peachGroup.add(meshL, meshR, stemMesh, leafMesh, haloMesh);
      peachGroup.castShadow = true;
      this.treeGroup.add(peachGroup);
      this.peaches.push(peachGroup);
    });

    this.scene.add(this.treeGroup);
  }

  buildSoilMounds() {
    this.moundGroup = new THREE.Group();
    this.moundGroup.position.set(0, 0, 0);

    const moundPositions = [
      [-1.9, 0.08, -0.65, 0, 0xFFDF73, 'star_stone'],
      [-0.8, 0.08, -1.35, 1, 0x67E6DC, 'moon_ruyi'],
      [ 1.8, 0.08, -1.35, 2, 0xFF6B8B, 'crystal_gourd'],
      [ 2.6, 0.08, -0.45, 3, 0xFFA94D, 'copper_coin']
    ];

    moundPositions.forEach(([x, y, z, idx, relicColor, type]) => {
      const mound = new THREE.Group();
      mound.position.set(x, y, z);
      mound.userData = { id: `mound_${idx}`, index: idx, tilled: false, relicType: type };

      // Soil mound dome
      const soilGeo = new THREE.SphereGeometry(0.55, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5);
      soilGeo.scale(1.15, 0.52, 1.15);
      const soilMat = new THREE.MeshStandardMaterial({
        color: 0x6B4724,
        roughness: 0.95,
        metalness: 0.04
      });
      const soilMesh = new THREE.Mesh(soilGeo, soilMat);
      soilMesh.receiveShadow = true;
      soilMesh.name = 'soil_dome';
      mound.add(soilMesh);

      // Cute green sprout on un-tilled mound
      const sproutGeo = new THREE.ConeGeometry(0.08, 0.22, 8);
      const sproutMat = new THREE.MeshStandardMaterial({ color: 0x76C893, roughness: 0.6, metalness: 0.05 });
      const sprout = new THREE.Mesh(sproutGeo, sproutMat);
      sprout.position.y = 0.28;
      sprout.name = 'sprout';
      mound.add(sprout);

      // Hidden Relic inside mound (revealed on till)
      const relicGroup = new THREE.Group();
      relicGroup.position.set(0, 0.45, 0);
      relicGroup.name = 'relic';
      relicGroup.visible = false;

      const relicMat = new THREE.MeshStandardMaterial({
        color: relicColor,
        roughness: 0.35,
        metalness: 0.18,
        emissive: relicColor,
        emissiveIntensity: 0.35
      });

      if (type === 'star_stone') {
        const starGeo = new THREE.OctahedronGeometry(0.24, 0);
        const starMesh = new THREE.Mesh(starGeo, relicMat);
        relicGroup.add(starMesh);
      } else if (type === 'moon_ruyi') {
        const ruyiGeo = new THREE.TorusGeometry(0.22, 0.065, 10, 20, Math.PI * 1.2);
        const ruyiMesh = new THREE.Mesh(ruyiGeo, relicMat);
        ruyiMesh.rotation.x = Math.PI * 0.4;
        relicGroup.add(ruyiMesh);
      } else if (type === 'crystal_gourd') {
        const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), relicMat);
        const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 12), relicMat);
        b2.position.y = 0.22;
        relicGroup.add(b1, b2);
      } else {
        const coinGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 18);
        const coinMesh = new THREE.Mesh(coinGeo, relicMat);
        coinMesh.rotation.x = Math.PI * 0.5;
        relicGroup.add(coinMesh);
      }

      mound.add(relicGroup);
      this.moundGroup.add(mound);
      this.mounds.push(mound);
    });

    this.scene.add(this.moundGroup);
  }

  buildCloudOx() {
    this.cloudOx = new CloudOxModel();
    this.cloudOx.group.position.set(-2.6, 0.02, 0.6);
    this.cloudOx.group.rotation.y = 0.55;
    this.scene.add(this.cloudOx.group);
  }

  buildInteractiveTools() {
    // 1. Draggable 3D Magic Cloud Watering Pot
    this.cloudCanGroup = new THREE.Group();
    this.cloudCanGroup.position.set(-2.0, 0.52, 2.75);
    this.cloudCanGroup.userData = { id: 'cloud_can', homePos: new THREE.Vector3(-2.0, 0.52, 2.75) };

    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xF0F8FF,
      roughness: 0.4,
      metalness: 0.06,
      emissive: 0x334466,
      emissiveIntensity: 0.15
    });

    // Puffy cloud body
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), cloudMat);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), cloudMat);
    c2.position.set(0.18, 0.04, 0);
    const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), cloudMat);
    c3.position.set(-0.18, 0.04, 0);

    // Spout & Rainbow Handle
    const spoutGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.32, 12);
    spoutGeo.rotateZ(-Math.PI * 0.35);
    const spoutMat = new THREE.MeshStandardMaterial({ color: 0xFFD56B, roughness: 0.35, metalness: 0.18 });
    const spoutMesh = new THREE.Mesh(spoutGeo, spoutMat);
    spoutMesh.position.set(0.32, 0.12, 0);

    const handleGeo = new THREE.TorusGeometry(0.18, 0.035, 10, 20, Math.PI);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xFF85A1, roughness: 0.5, metalness: 0.05 });
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.rotation.z = Math.PI * 0.5;
    handleMesh.position.set(-0.28, 0.12, 0);

    this.cloudCanGroup.add(c1, c2, c3, spoutMesh, handleMesh);
    this.scene.add(this.cloudCanGroup);

    // 2. Draggable 3D Golden Hoe
    this.hoeGroup = new THREE.Group();
    this.hoeGroup.position.set(-0.6, 0.48, 2.75);
    this.hoeGroup.userData = { id: 'golden_hoe', homePos: new THREE.Vector3(-0.6, 0.48, 2.75) };

    const handleWoodGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.75, 10);
    handleWoodGeo.rotateX(Math.PI * 0.25);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0xC19A6B, roughness: 0.75, metalness: 0.06 });
    const woodMesh = new THREE.Mesh(handleWoodGeo, woodMat);

    const bladeGeo = new THREE.BoxGeometry(0.24, 0.15, 0.04);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xFFDF73, roughness: 0.35, metalness: 0.20, emissive: 0x443300 });
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.set(0, 0.24, -0.25);
    bladeMesh.rotation.x = Math.PI * 0.25;

    this.hoeGroup.add(woodMesh, bladeMesh);
    this.scene.add(this.hoeGroup);

    // 3. Woven Bamboo Peach Basket
    this.basketGroup = new THREE.Group();
    this.basketGroup.position.set(1.4, 0.42, 2.75);
    this.basketGroup.userData = { id: 'peach_basket', count: 0 };

    const basketGeo = new THREE.CylinderGeometry(0.42, 0.32, 0.32, 20);
    const basketMat = new THREE.MeshStandardMaterial({ color: 0xDEB887, roughness: 0.85, metalness: 0.05 });
    const basketMesh = new THREE.Mesh(basketGeo, basketMat);
    basketMesh.receiveShadow = true;

    // Rim
    const rimGeo = new THREE.TorusGeometry(0.42, 0.04, 10, 24);
    rimGeo.rotateX(Math.PI * 0.5);
    const rimMesh = new THREE.Mesh(rimGeo, basketMat);
    rimMesh.position.y = 0.16;

    this.basketGroup.add(basketMesh, rimMesh);

    // Little peaches in basket
    this.basketPeaches = [];
    [[-0.14, 0.14, 0], [0.14, 0.14, 0], [0, 0.24, 0]].forEach(([px, py, pz]) => {
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xFF8595, roughness: 0.5, metalness: 0.08 })
      );
      pMesh.position.set(px, py, pz);
      pMesh.visible = false;
      this.basketGroup.add(pMesh);
      this.basketPeaches.push(pMesh);
    });

    this.scene.add(this.basketGroup);
  }

  buildVisitorSteppingStones() {
    this.visitorGroup = new THREE.Group();
    const stonePositions = [
      [-1.8, 0.05, 1.25],
      [ 0.0, 0.05, 1.25],
      [ 1.8, 0.05, 1.25]
    ];

    stonePositions.forEach(([x, y, z], slotIdx) => {
      const slot = {
        index: slotIdx,
        pos: new THREE.Vector3(x, y, z),
        characterMesh: null,
        characterId: null,
        bubbleMesh: null
      };
      this.visitorSlots.push(slot);
    });
  }

  setVisitorInSlot(slotIdx, critterId) {
    const slot = this.visitorSlots[slotIdx];
    if (!slot) return;

    if (slot.characterMesh) {
      this.scene.remove(slot.characterMesh);
      slot.characterMesh = null;
    }

    let builder = null;
    switch (critterId) {
      case 'catnap': builder = buildCatNapPlushModel; break;
      case 'dogday': builder = buildDogDayPlushModel; break;
      case 'hoppy': builder = buildHoppyHopscotchPlushModel; break;
      case 'craftycorn': builder = buildCraftyCornPlushModel; break;
      case 'bubba': builder = buildBubbaBubbaphantPlushModel; break;
      case 'picky': builder = buildPickyPiggyPlushModel; break;
      case 'kickin': builder = buildKickinChickenPlushModel; break;
      case 'bobby': builder = buildBobbyBearHugPlushModel; break;
      case 'baba': builder = buildBabaChopsPlushModel; break;
      default: builder = buildDogDayPlushModel;
    }
    const rig = builder(THREE);
    const mesh = rig.root || rig;
    mesh.position.copy(slot.pos);
    mesh.scale.set(0.65, 0.65, 0.65);
    mesh.rotation.y = Math.PI; // Face the camera
    this.scene.add(mesh);

    slot.characterMesh = mesh;
    slot.characterId = critterId;
    slot.model = rig;

    this.enforceMaterialHygiene();
  }

  clearSlot(slotIdx) {
    const slot = this.visitorSlots[slotIdx];
    if (slot && slot.characterMesh) {
      this.scene.remove(slot.characterMesh);
      slot.characterMesh = null;
      slot.characterId = null;
      slot.model = null;
    }
  }

  enforceMaterialHygiene() {
    this.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          if (m.metalness !== undefined && m.metalness > 0.22) {
            m.metalness = 0.22;
          }
        });
      }
    });
  }

  setSeasonTheme(waveNum) {
    if (waveNum === 1) {
      // Spring Blossom (fresh pastel peach)
      this.scene.background.set(0xF5EBDC);
      this.hemiLight.color.set(0xFFF6E6);
      this.dirLight.color.set(0xFFEAA7);
    } else if (waveNum === 2) {
      // Twilight Glade (deep dusk purple-blue with warm lanterns)
      this.scene.background.set(0x2D2240);
      this.hemiLight.color.set(0x8C7CA6);
      this.dirLight.color.set(0xFFB570);
      this.dirLight.intensity = 1.8;
    } else {
      // Imperial Starlight Sanctuary (celestial royal indigo with sparkling golden glow)
      this.scene.background.set(0x1B162C);
      this.hemiLight.color.set(0xA695D4);
      this.dirLight.color.set(0xFFD56B);
      this.treeGlow.intensity = 1.8;
    }
    this.enforceMaterialHygiene();
  }

  onResize() {
    this.width = this.container.clientWidth || 1280;
    this.height = this.container.clientHeight || 800;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }

  render(dt = 0.016) {
    if (this.cloudOx) {
      this.cloudOx.update(dt);
    }

    // Peach halo rotation
    this.peaches.forEach(p => {
      const halo = p.getObjectByName('halo');
      if (halo && halo.visible) {
        halo.rotation.z += dt * 1.5;
      }
    });

    // Relic rotation
    this.mounds.forEach(m => {
      const relic = m.getObjectByName('relic');
      if (relic && relic.visible) {
        relic.rotation.y += dt * 2.0;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}
