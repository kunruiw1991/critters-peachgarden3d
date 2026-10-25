import * as THREE from './three.module.min.js';

/**
 * 3D Cloud Ox Companion Model (祥云大黑牛)
 * Inspired by 《开局长生万古，苟到天荒地老》
 * Features:
 * - Chubby charcoal-indigo plush body with warm cream belly/muzzle patch
 * - Curved golden/ivory cloud horns with scroll ends
 * - Red braided collar with dangling 3D golden bell
 * - Cute button eyes, smiling muzzle, rosy cheeks
 * - Squash-and-stretch chewing, ear-wiggle, and tail-swish animations
 * - metalness <= 0.22 non-IBL material hygiene
 */
export class CloudOxModel {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'cloud_ox_root';

    // Materials
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: 0x333242,
      roughness: 0.65,
      metalness: 0.08
    });
    this.muzzleMat = new THREE.MeshStandardMaterial({
      color: 0xFFF2E6,
      roughness: 0.72,
      metalness: 0.05
    });
    this.hornMat = new THREE.MeshStandardMaterial({
      color: 0xFFDF73,
      roughness: 0.35,
      metalness: 0.18
    });
    this.collarMat = new THREE.MeshStandardMaterial({
      color: 0xE84545,
      roughness: 0.55,
      metalness: 0.05
    });
    this.bellMat = new THREE.MeshStandardMaterial({
      color: 0xFFC83B,
      roughness: 0.3,
      metalness: 0.20
    });
    this.eyeMat = new THREE.MeshStandardMaterial({
      color: 0x1A1820,
      roughness: 0.15,
      metalness: 0.10
    });
    this.blushMat = new THREE.MeshBasicMaterial({
      color: 0xFF9EA7,
      transparent: true,
      opacity: 0.75
    });
    this.hoofMat = new THREE.MeshStandardMaterial({
      color: 0x22212C,
      roughness: 0.6,
      metalness: 0.12
    });

    this.chewTimer = 0;
    this.isChewing = false;
    this.tailTimer = 0;

    this.build();
  }

  build() {
    // 1. Torso (chubby resting bean body)
    const bodyGeo = new THREE.SphereGeometry(0.72, 24, 20);
    bodyGeo.scale(1.25, 0.95, 1.1);
    this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMat);
    this.bodyMesh.position.set(0, 0.68, 0);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Cream Belly Patch
    const bellyGeo = new THREE.SphereGeometry(0.55, 20, 16);
    bellyGeo.scale(1.0, 0.75, 0.4);
    const bellyMesh = new THREE.Mesh(bellyGeo, this.muzzleMat);
    bellyMesh.position.set(0, 0.52, 0.58);
    this.group.add(bellyMesh);

    // 2. Head Group
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.25, 0.62);

    const headGeo = new THREE.SphereGeometry(0.52, 24, 20);
    headGeo.scale(1.15, 0.95, 1.05);
    const headMesh = new THREE.Mesh(headGeo, this.bodyMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Snout / Muzzle
    const snoutGeo = new THREE.SphereGeometry(0.38, 20, 16);
    snoutGeo.scale(1.1, 0.72, 0.9);
    const snoutMesh = new THREE.Mesh(snoutGeo, this.muzzleMat);
    snoutMesh.position.set(0, -0.12, 0.38);
    this.headGroup.add(snoutMesh);

    // Nostrils
    const nostrilGeo = new THREE.SphereGeometry(0.045, 10, 8);
    nostrilGeo.scale(0.8, 1.4, 0.6);
    const nostrilL = new THREE.Mesh(nostrilGeo, this.eyeMat);
    nostrilL.position.set(-0.12, -0.11, 0.68);
    const nostrilR = new THREE.Mesh(nostrilGeo, this.eyeMat);
    nostrilR.position.set(0.12, -0.11, 0.68);
    this.headGroup.add(nostrilL, nostrilR);

    // Smiling Mouth Line (curved torus segment)
    const mouthGeo = new THREE.TorusGeometry(0.14, 0.022, 10, 20, Math.PI * 0.9);
    const mouthMesh = new THREE.Mesh(mouthGeo, this.eyeMat);
    mouthMesh.rotation.x = Math.PI * 0.6;
    mouthMesh.position.set(0, -0.22, 0.64);
    this.headGroup.add(mouthMesh);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.085, 16, 14);
    const glintGeo = new THREE.SphereGeometry(0.028, 10, 8);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

    this.eyeL = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.eyeL.position.set(-0.24, 0.10, 0.44);
    const glintL = new THREE.Mesh(glintGeo, glintMat);
    glintL.position.set(-0.02, 0.03, 0.07);
    this.eyeL.add(glintL);

    this.eyeR = new THREE.Mesh(eyeGeo, this.eyeMat);
    this.eyeR.position.set(0.24, 0.10, 0.44);
    const glintR = new THREE.Mesh(glintGeo, glintMat);
    glintR.position.set(-0.02, 0.03, 0.07);
    this.eyeR.add(glintR);

    this.headGroup.add(this.eyeL, this.eyeR);

    // Cheerful Pink Blushes
    const blushGeo = new THREE.CircleGeometry(0.09, 16);
    const blushL = new THREE.Mesh(blushGeo, this.blushMat);
    blushL.position.set(-0.35, -0.05, 0.43);
    blushL.rotation.y = -0.4;
    const blushR = new THREE.Mesh(blushGeo, this.blushMat);
    blushR.position.set(0.35, -0.05, 0.43);
    blushR.rotation.y = 0.4;
    this.headGroup.add(blushL, blushR);

    // 3. Golden Cloud Horns (curved torus arc)
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.22, 0.24, -0.05),
      new THREE.Vector3(0.42, 0.42, -0.16),
      new THREE.Vector3(0.55, 0.58, -0.08),
      new THREE.Vector3(0.48, 0.72, 0.05)
    ]);
    const hornGeoR = new THREE.TubeGeometry(hornCurve, 20, 0.075, 12, false);
    this.hornR = new THREE.Mesh(hornGeoR, this.hornMat);
    this.hornR.position.set(0.18, 0.32, 0.05);

    // Left horn mirrored
    const hornCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.22, 0.24, -0.05),
      new THREE.Vector3(-0.42, 0.42, -0.16),
      new THREE.Vector3(-0.55, 0.58, -0.08),
      new THREE.Vector3(-0.48, 0.72, 0.05)
    ]);
    const hornGeoL = new THREE.TubeGeometry(hornCurveL, 20, 0.075, 12, false);
    this.hornL = new THREE.Mesh(hornGeoL, this.hornMat);
    this.hornL.position.set(-0.18, 0.32, 0.05);

    this.headGroup.add(this.hornL, this.hornR);

    // Ears (fluffy rounded cones)
    const earGeo = new THREE.ConeGeometry(0.12, 0.34, 16);
    earGeo.rotateZ(Math.PI * 0.5);
    earGeo.scale(1.0, 0.5, 1.2);

    this.earL = new THREE.Mesh(earGeo, this.bodyMat);
    this.earL.position.set(-0.52, 0.15, 0.05);
    this.earL.rotation.set(0, 0, 0.4);

    this.earR = new THREE.Mesh(earGeo, this.bodyMat);
    this.earR.position.set(0.52, 0.15, 0.05);
    this.earR.rotation.set(0, 0, -0.4);

    this.headGroup.add(this.earL, this.earR);
    this.group.add(this.headGroup);

    // 4. Red Braided Collar & Golden Bell
    const collarGeo = new THREE.TorusGeometry(0.55, 0.055, 12, 32);
    collarGeo.rotateX(Math.PI * 0.38);
    const collarMesh = new THREE.Mesh(collarGeo, this.collarMat);
    collarMesh.position.set(0, 0.98, 0.42);
    this.group.add(collarMesh);

    // Golden Bell
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 0.72, 0.88);
    const bellSphereGeo = new THREE.SphereGeometry(0.12, 16, 14);
    const bellSphere = new THREE.Mesh(bellSphereGeo, this.bellMat);
    const bellRimGeo = new THREE.TorusGeometry(0.11, 0.02, 10, 20);
    const bellRim = new THREE.Mesh(bellRimGeo, this.bellMat);
    bellRim.position.y = -0.05;
    bellGroup.add(bellSphere, bellRim);
    this.bellGroup = bellGroup;
    this.group.add(bellGroup);

    // 5. Four Chubby Resting Legs with Hooves
    const legGeo = new THREE.CylinderGeometry(0.16, 0.18, 0.42, 16);
    const hoofGeo = new THREE.CylinderGeometry(0.18, 0.19, 0.12, 16);

    const legPositions = [
      [-0.45, 0.24, 0.52],
      [ 0.45, 0.24, 0.52],
      [-0.48, 0.24, -0.48],
      [ 0.48, 0.24, -0.48]
    ];

    this.legs = [];
    legPositions.forEach(([x, y, z]) => {
      const legRoot = new THREE.Group();
      legRoot.position.set(x, y, z);
      const legMesh = new THREE.Mesh(legGeo, this.bodyMat);
      legMesh.position.y = 0.1;
      const hoofMesh = new THREE.Mesh(hoofGeo, this.hoofMat);
      hoofMesh.position.y = -0.12;
      legRoot.add(legMesh, hoofMesh);
      this.legs.push(legRoot);
      this.group.add(legRoot);
    });

    // 6. Tail with Fluffy Tuft
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.78, -0.74);
    const tailStemGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.48, 10);
    tailStemGeo.rotateX(Math.PI * 0.35);
    const tailStem = new THREE.Mesh(tailStemGeo, this.bodyMat);
    const tailTuftGeo = new THREE.SphereGeometry(0.12, 14, 12);
    tailTuftGeo.scale(0.8, 1.4, 0.8);
    const tailTuft = new THREE.Mesh(tailTuftGeo, this.hornMat);
    tailTuft.position.set(0, -0.28, -0.22);
    this.tailGroup.add(tailStem, tailTuft);
    this.group.add(this.tailGroup);
  }

  feedPeach() {
    this.isChewing = true;
    this.chewTimer = 2.4; // 2.4 seconds of happy chewing
  }

  update(dt) {
    this.tailTimer += dt * 3.0;
    this.tailGroup.rotation.y = Math.sin(this.tailTimer) * 0.35;
    this.bellGroup.rotation.z = Math.sin(this.tailTimer * 0.8) * 0.15;

    if (this.isChewing) {
      this.chewTimer -= dt;
      const chewPhase = Math.sin(this.chewTimer * 16.0);
      this.headGroup.scale.y = 1.0 + chewPhase * 0.08;
      this.headGroup.scale.x = 1.0 - chewPhase * 0.06;
      this.earL.rotation.z = 0.4 + Math.abs(chewPhase) * 0.2;
      this.earR.rotation.z = -0.4 - Math.abs(chewPhase) * 0.2;

      if (this.chewTimer <= 0) {
        this.isChewing = false;
        this.headGroup.scale.set(1, 1, 1);
        this.earL.rotation.z = 0.4;
        this.earR.rotation.z = -0.4;
      }
    } else {
      // Gentle idle breathing
      const breath = Math.sin(Date.now() * 0.002) * 0.025;
      this.bodyMesh.scale.y = 0.95 + breath;
      this.headGroup.position.y = 1.25 + breath * 0.5;
    }
  }
}
