import { Scene3D } from './scene3d.js';
import { audioManager } from './audio.js';

/**
 * Critter Peach Garden 3D Main Game Loop & Interaction Manager.
 * 100% Zero-Text, Zero-Voiceover, Child-Friendly ASMR Gardening Experience.
 */
class PeachGardenGame {
  constructor() {
    this.container = document.getElementById('gameContainer');
    this.scene3d = new Scene3D(this.container);

    this.state = {
      wave: 1,
      maxWave: 3,
      coins: 0,
      stars: 0,
      peachesInBasket: 2,
      maxBasket: 5,
      gardenerId: 'dogday',
      activeTool: null,
      soundEnabled: true,
      gameOver: false,
      customersServed: 0,
      customersInWave: 6
    };

    this.gardenerList = ['dogday', 'catnap', 'hoppy', 'craftycorn', 'bubba', 'picky', 'kickin'];
    this.gardenerIndex = 0;

    // Customer queue & wave definitions
    this.waveSchedules = {
      1: [
        { critter: 'catnap', item: 'peach', patience: 32 },
        { critter: 'hoppy', item: 'peach', patience: 30 },
        { critter: 'craftycorn', item: 'star_stone', patience: 32 },
        { critter: 'bubba', item: 'peach', patience: 30 },
        { critter: 'picky', item: 'moon_ruyi', patience: 32 },
        { critter: 'kickin', item: 'peach', patience: 30 }
      ],
      2: [
        { critter: 'bobby', item: 'peach', patience: 28 },
        { critter: 'catnap', item: 'moon_ruyi', patience: 28 },
        { critter: 'dogday', item: 'crystal_gourd', patience: 28 },
        { critter: 'hoppy', item: 'peach', patience: 28 },
        { critter: 'picky', item: 'copper_coin', patience: 28 },
        { critter: 'craftycorn', item: 'peach', patience: 28 },
        { critter: 'bubba', item: 'crystal_gourd', patience: 28 }
      ],
      3: [
        { critter: 'catnap', item: 'crystal_gourd', patience: 26 },
        { critter: 'dogday', item: 'peach', patience: 26 },
        { critter: 'bobby', item: 'star_stone', patience: 26 },
        { critter: 'hoppy', item: 'copper_coin', patience: 26 },
        { critter: 'bubba', item: 'moon_ruyi', patience: 26 },
        { critter: 'picky', item: 'peach', patience: 26 },
        { critter: 'kickin', item: 'star_stone', patience: 26 },
        { critter: 'craftycorn', item: 'crystal_gourd', patience: 26 }
      ]
    };

    this.activeVisitors = [null, null, null];
    this.currentScheduleIdx = 0;

    this.initUI();
    this.bindEvents();
    this.startWave(1);

    // Expose test helper for verification
    window.__gameTest = {
      getState: () => ({ ...this.state }),
      harvestPeach: (idx = 0) => this.harvestPeach(idx),
      tillMound: (idx = 0) => this.tillMound(idx),
      waterPeach: (idx = 0) => this.waterPeach(idx),
      feedOx: () => this.feedOx(),
      serveVisitor: (slotIdx = 0) => this.fulfillVisitor(slotIdx),
      completeWave: () => this.triggerWaveClear(),
      cycleGardener: () => this.cycleGardener()
    };

    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initUI() {
    this.avatarWrap = document.getElementById('gardenerAvatarWrap');
    this.avatarImg = document.getElementById('gardenerAvatar');
    this.soundBtn = document.getElementById('soundToggleBtn');
    this.restartBtn = document.getElementById('restartBtn');
    this.wavePips = document.getElementById('wavePips');
    this.podiumModal = document.getElementById('podiumModal');

    this.updateAvatarUI();
    this.updateBasketUI();
  }

  updateAvatarUI() {
    const critter = this.gardenerList[this.gardenerIndex];
    this.state.gardenerId = critter;
    if (this.avatarImg) {
      this.avatarImg.src = `./assets/${critter}_avatar.png`;
    }
  }

  cycleGardener() {
    this.gardenerIndex = (this.gardenerIndex + 1) % this.gardenerList.length;
    this.updateAvatarUI();
    audioManager.playCritterServe();
  }

  updateBasketUI() {
    const dotsContainer = document.getElementById('basketPips');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < this.state.maxBasket; i++) {
        const dot = document.createElement('div');
        dot.className = `basket-pip ${i < this.state.peachesInBasket ? 'filled' : ''}`;
        dotsContainer.appendChild(dot);
      }
    }
  }

  startWave(waveNum) {
    this.state.wave = waveNum;
    this.state.customersServed = 0;
    this.currentScheduleIdx = 0;
    const schedule = this.waveSchedules[waveNum];
    this.state.customersInWave = schedule.length;

    this.scene3d.setSeasonTheme(waveNum);
    this.activeVisitors = [null, null, null];
    for (let i = 0; i < 3; i++) {
      this.scene3d.clearSlot(i);
      this.hideBubble(i);
    }

    // Spawn first 2 visitors
    this.spawnVisitor(0);
    setTimeout(() => this.spawnVisitor(1), 1200);

    audioManager.playWaveFanfare();
  }

  spawnVisitor(slotIdx) {
    const schedule = this.waveSchedules[this.state.wave];
    if (this.currentScheduleIdx >= schedule.length) return;

    const data = schedule[this.currentScheduleIdx++];
    this.activeVisitors[slotIdx] = {
      ...data,
      slotIdx,
      maxPatience: data.patience,
      currentPatience: data.patience
    };

    this.scene3d.setVisitorInSlot(slotIdx, data.critter);
    this.showBubble(slotIdx, data.item);
  }

  showBubble(slotIdx, itemType) {
    const bubble = document.getElementById(`bubble_${slotIdx}`);
    if (!bubble) return;
    bubble.className = `visitor-bubble visible item-${itemType}`;
    const itemIcon = bubble.querySelector('.bubble-item-icon');
    if (itemIcon) {
      itemIcon.className = `bubble-item-icon icon-${itemType}`;
    }
  }

  hideBubble(slotIdx) {
    const bubble = document.getElementById(`bubble_${slotIdx}`);
    if (bubble) {
      bubble.className = 'visitor-bubble';
    }
  }

  harvestPeach(idx) {
    const peach = this.scene3d.peaches[idx];
    if (!peach || peach.userData.state !== 'RIPE') return false;

    if (this.state.peachesInBasket < this.state.maxBasket) {
      this.state.peachesInBasket++;
      peach.userData.state = 'BUD';
      peach.scale.set(0.4, 0.4, 0.4);
      const halo = peach.getObjectByName('halo');
      if (halo) halo.visible = false;

      this.updateBasketUI();
      audioManager.playPeachPop();

      // Regrow after 4.5s
      setTimeout(() => {
        peach.userData.state = 'RIPE';
        peach.scale.set(1.05, 1.05, 1.05);
        if (halo) halo.visible = true;
      }, 4500);

      return true;
    }
    return false;
  }

  waterPeach(idx) {
    const peach = this.scene3d.peaches[idx];
    if (!peach) return false;

    audioManager.playCloudRain();
    if (peach.userData.state === 'BUD') {
      peach.userData.state = 'RIPE';
      peach.scale.set(1.05, 1.05, 1.05);
      const halo = peach.getObjectByName('halo');
      if (halo) halo.visible = true;
      audioManager.playPeachPop();
      return true;
    }
    return false;
  }

  tillMound(idx) {
    const mound = this.scene3d.mounds[idx];
    if (!mound || mound.userData.tilled) return false;

    mound.userData.tilled = true;
    const sprout = mound.getObjectByName('sprout');
    if (sprout) sprout.visible = false;

    const relic = mound.getObjectByName('relic');
    if (relic) relic.visible = true;

    audioManager.playHoeDig();
    audioManager.playRelicDiscover();

    this.state.coins += 20;
    return true;
  }

  feedOx() {
    if (this.state.peachesInBasket > 0) {
      this.state.peachesInBasket--;
      this.updateBasketUI();
      this.scene3d.cloudOx.feedPeach();
      audioManager.playOxChomp();
      this.state.coins += 15;

      // Restore patience to all current visitors
      this.activeVisitors.forEach(v => {
        if (v) v.currentPatience = Math.min(v.maxPatience, v.currentPatience + 6.0);
      });
      return true;
    }
    return false;
  }

  fulfillVisitor(slotIdx) {
    const visitor = this.activeVisitors[slotIdx];
    if (!visitor) return false;

    if (visitor.item === 'peach') {
      if (this.state.peachesInBasket <= 0) return false;
      this.state.peachesInBasket--;
      this.updateBasketUI();
    } else {
      // Relic item: check if corresponding mound is tilled
      const mound = this.scene3d.mounds.find(m => m.userData.relicType === visitor.item);
      if (!mound || !mound.userData.tilled) return false;
    }

    // Success!
    this.state.coins += 30;
    this.state.customersServed++;
    audioManager.playCritterServe();

    this.hideBubble(slotIdx);
    this.scene3d.clearSlot(slotIdx);
    this.activeVisitors[slotIdx] = null;

    if (this.state.customersServed >= this.state.customersInWave) {
      setTimeout(() => this.triggerWaveClear(), 800);
    } else {
      setTimeout(() => this.spawnVisitor(slotIdx), 1500);
    }
    return true;
  }

  triggerWaveClear() {
    if (this.state.wave < this.state.maxWave) {
      this.startWave(this.state.wave + 1);
    } else {
      this.showPodium();
    }
  }

  showPodium() {
    this.state.gameOver = true;
    if (!this.podiumModal) return;

    // Strict monotonic Olympic Podium staircase by rank
    // 1st: 60%, 2nd: 47%, 3rd: 36%, 4th: 26%, 5th: 17%
    const RANK_HEIGHT_PCT = { 1: 60, 2: 47, 3: 36, 4: 26, 5: 17 };
    const RANK_DISC_COUNTS = { 1: 9, 2: 7, 3: 5, 4: 3, 5: 1 };

    const rivals = [
      { id: 'catnap', score: 240 },
      { id: 'craftycorn', score: 165 },
      { id: 'bubba', score: 110 },
      { id: 'baba', score: 55 }
    ];

    const entries = [
      { id: this.state.gardenerId, isPlayer: true, score: Math.max(this.state.coins, 280) },
      ...rivals
    ].sort((a, b) => b.score - a.score);

    const podiumRow = document.getElementById('podiumColumns');
    if (podiumRow) {
      podiumRow.innerHTML = '';
      entries.forEach((entry, idx) => {
        const rank = idx + 1;
        const col = document.createElement('div');
        col.className = `podium-col ${entry.isPlayer ? 'is-player' : ''} rank-${rank}`;

        const crownOrBadge = rank === 1 ? '<div class="podium-crown">👑</div>' : '';
        const hatSvg = entry.isPlayer ? '<div class="podium-farmer-hat">👒</div>' : '';

        const discCount = RANK_DISC_COUNTS[rank] || 2;
        let discsHtml = '';
        for (let d = 0; d < discCount; d++) {
          discsHtml += '<div class="podium-disc"></div>';
        }

        col.innerHTML = `
          <div class="podium-avatar-wrap">
            ${crownOrBadge}
            ${hatSvg}
            <img class="podium-avatar" src="./assets/${entry.id}_avatar.png" alt="" />
          </div>
          <div class="podium-pillar" style="height: ${RANK_HEIGHT_PCT[rank]}%; flex-shrink: 0;">
            <div class="podium-discs-stack">${discsHtml}</div>
          </div>
        `;
        podiumRow.appendChild(col);
      });
    }

    this.podiumModal.classList.add('visible');
    audioManager.playWaveFanfare();
  }

  bindEvents() {
    // Gardener Avatar toggle
    if (this.avatarWrap) {
      this.avatarWrap.addEventListener('pointerup', () => this.cycleGardener());
    }

    // Sound toggle
    if (this.soundBtn) {
      this.soundBtn.addEventListener('pointerup', () => {
        this.state.soundEnabled = !this.state.soundEnabled;
        audioManager.muted = !this.state.soundEnabled;
        this.soundBtn.classList.toggle('muted', !this.state.soundEnabled);
      });
    }

    // Restart button
    if (this.restartBtn) {
      this.restartBtn.addEventListener('pointerup', () => {
        this.state.coins = 0;
        this.state.peachesInBasket = 2;
        if (this.podiumModal) this.podiumModal.classList.remove('visible');
        this.startWave(1);
      });
    }

    // Desktop/touch raycast interaction on canvas
    const canvas = this.scene3d.renderer.domElement;
    canvas.addEventListener('pointerup', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.scene3d.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.scene3d.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.scene3d.raycaster.setFromCamera(this.scene3d.mouse, this.scene3d.camera);

      // 1. Check Peaches
      for (let i = 0; i < this.scene3d.peaches.length; i++) {
        const hits = this.scene3d.raycaster.intersectObjects(this.scene3d.peaches[i].children, true);
        if (hits.length > 0) {
          if (this.scene3d.peaches[i].userData.state === 'RIPE') {
            this.harvestPeach(i);
          } else {
            this.waterPeach(i);
          }
          return;
        }
      }

      // 2. Check Soil Mounds
      for (let i = 0; i < this.scene3d.mounds.length; i++) {
        const hits = this.scene3d.raycaster.intersectObjects(this.scene3d.mounds[i].children, true);
        if (hits.length > 0) {
          this.tillMound(i);
          return;
        }
      }

      // 3. Check Cloud Ox
      const oxHits = this.scene3d.raycaster.intersectObjects(this.scene3d.cloudOx.group.children, true);
      if (oxHits.length > 0) {
        this.feedOx();
        return;
      }

      // 4. Check Visitors
      for (let i = 0; i < 3; i++) {
        const slot = this.scene3d.visitorSlots[i];
        if (slot && slot.characterMesh) {
          const hits = this.scene3d.raycaster.intersectObjects(slot.characterMesh.children, true);
          if (hits.length > 0) {
            this.fulfillVisitor(i);
            return;
          }
        }
      }
    });

    // Also bind thought bubble taps
    for (let i = 0; i < 3; i++) {
      const b = document.getElementById(`bubble_${i}`);
      if (b) {
        b.addEventListener('pointerup', () => this.fulfillVisitor(i));
      }
    }

    // Cloud tool / Hoe tool click shortcuts
    const cloudToolBtn = document.getElementById('cloudToolBtn');
    if (cloudToolBtn) {
      cloudToolBtn.addEventListener('pointerup', () => {
        // Water any non-ripe peach
        const unwatered = this.scene3d.peaches.find(p => p.userData.state !== 'RIPE');
        if (unwatered) {
          this.waterPeach(unwatered.userData.index);
        } else {
          audioManager.playCloudRain();
        }
      });
    }

    const hoeToolBtn = document.getElementById('hoeToolBtn');
    if (hoeToolBtn) {
      hoeToolBtn.addEventListener('pointerup', () => {
        // Till first untilled mound
        const untilled = this.scene3d.mounds.find(m => !m.userData.tilled);
        if (untilled) {
          this.tillMound(untilled.userData.index);
        } else {
          audioManager.playHoeDig();
        }
      });
    }

    const oxFeedBtn = document.getElementById('oxFeedBtn');
    if (oxFeedBtn) {
      oxFeedBtn.addEventListener('pointerup', () => this.feedOx());
    }
  }

  animate(time) {
    requestAnimationFrame(this.animate);
    const dt = Math.min((time - this.lastTime) * 0.001, 0.1);
    this.lastTime = time;

    // Patience timers decay gently
    if (!this.state.gameOver) {
      for (let i = 0; i < 3; i++) {
        const v = this.activeVisitors[i];
        if (v) {
          v.currentPatience -= dt;
          const bubble = document.getElementById(`bubble_${i}`);
          if (bubble) {
            const pct = Math.max(0, v.currentPatience / v.maxPatience);
            const ring = bubble.querySelector('.bubble-patience-ring');
            if (ring) {
              ring.style.strokeDashoffset = `${(1 - pct) * 100}%`;
            }
          }
          if (v.currentPatience <= 0) {
            // Visitor leaves happily after long wait, replaced by new visitor
            this.hideBubble(i);
            this.scene3d.clearSlot(i);
            this.activeVisitors[i] = null;
            setTimeout(() => this.spawnVisitor(i), 1200);
          }
        }
      }
    }

    this.scene3d.render(dt);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.peachGame = new PeachGardenGame();
});
