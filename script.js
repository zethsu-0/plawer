// --- Seeded Random Number Generator (LCG) ---
class RNG {
    constructor(seed = 5) {
        this.s = seed;
      }
      next() {
        this.s = (this.s * 1664525 + 1013904223) % 4294967296;
        return this.s / 4294967296;
      }
      uniform(min, max) {
        return min + this.next() * (max - min);
      }
      normal(mean = 0, std = 1) {
        let u = 0, v = 0;
        while(u === 0) u = this.next();
        while(v === 0) v = this.next();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + num * std;
      }
      choice(arr, p) {
        if (!p) return arr[Math.floor(this.next() * arr.length)];
        let r = this.next();
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
          sum += p[i];
          if (r <= sum) return arr[i];
        }
        return arr[arr.length - 1];
      }
      integers(min, max, count) {
        let res = new Int32Array(count);
        for(let i=0; i<count; i++) {
          res[i] = Math.floor(this.uniform(min, max));
        }
        return res;
      }
      permutation(n) {
        let arr = new Int32Array(n);
        for(let i=0; i<n; i++) arr[i] = i;
        for(let i=n-1; i>0; i--) {
          let j = Math.floor(this.next() * (i + 1));
          let tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
      }
      random() {
        return this.next();
      }
    }

    // --- Math & Helper Functions ---
    const SEED = 5;
    const TIME_SCALE = 1.0;
    const TICK_MS = 16; // ~60fps smooth
    const WIN_FRAC = 0.92;
    const LOOP = false;

    const KEYS = [
      [0.0, 0.00, 0.00, 0.00, 0.0, 0.00, 0.00],
      [5.0, 0.42, 0.22, 0.00, 0.0, 0.25, 0.00],
      [10.0, 0.62, 0.42, 0.00, 0.0, 0.50, 0.35],
      [16.0, 0.80, 0.68, 0.50, 0.0, 0.72, 0.55],
      [24.0, 1.00, 1.00, 1.00, 0.0, 1.00, 1.00],
      [30.0, 1.00, 1.00, 1.00, 0.0, 1.00, 1.00],
    ];
    const T_END = 30.0;

    const SOIL_PAL = [[34, 25, 20], [50, 36, 28], [68, 50, 37], [88, 65, 47], [108, 82, 60], [64, 58, 52]];
    const STEM_PAL = [[255, 100, 120], [255, 130, 150], [255, 150, 170], [255, 180, 190]];
    const STEM_WILT = [[200, 80, 100], [180, 70, 90], [220, 90, 110]];
    const LEAF_PAL = [[255, 140, 160], [255, 160, 175], [255, 180, 190], [255, 200, 210]];
    const LEAF_WILT = [[220, 100, 120], [200, 90, 110], [230, 110, 130]];
    const RIB_PAL = [[210, 180, 255], [170, 230, 220]];
    const WILT_PAL = [[150, 86, 128], [116, 64, 108], [88, 52, 88], [126, 94, 104], [104, 72, 56]];
    const RIM_PAL = [[205, 165, 255], [255, 190, 250], [170, 140, 255]];
    const HI_PAL = [[235, 215, 255], [255, 225, 250]];
    const GOLD_PAL = [[255, 214, 110], [255, 238, 170], [255, 184, 90]];
    const STAMEN_PAL = [[255, 240, 255], [255, 215, 235], [255, 230, 150], [255, 190, 80]];
    const STAMEN_WILT = [[140, 112, 84], [120, 96, 72]];

    const LAYERS = [
      {n: 8, ac: 0.60, ao: 1.00, kc: -1.20, ko: 0.45, L: 1.00, wc: 0.20, wo: 0.34, d: 1150, off: 0.00,
       pal: [[250, 128, 114], [235, 110, 98], [220, 95, 85], [205, 82, 72], [190, 70, 62]]},
      {n: 6, ac: 0.48, ao: 0.68, kc: -1.05, ko: 0.15, L: 0.88, wc: 0.19, wo: 0.31, d: 950, off: 0.40,
       pal: [[255, 155, 142], [255, 135, 120], [245, 115, 102], [230, 100, 88]]},
      {n: 5, ac: 0.36, ao: 0.46, kc: -0.85, ko: -0.05, L: 0.72, wc: 0.17, wo: 0.27, d: 760, off: 0.20,
       pal: [[255, 185, 175], [255, 155, 142], [255, 130, 115], [245, 110, 95]]},
      {n: 4, ac: 0.22, ao: 0.32, kc: -0.50, ko: -0.10, L: 0.46, wc: 0.14, wo: 0.22, d: 480, off: 0.55,
       pal: [[255, 215, 210], [255, 190, 180], [255, 160, 145]]},
    ];

    const LEAF_DEFS = [
      [0.10, +1, 1.00, 0.55, -0.80],
      [0.16, -1, 0.90, 0.50, -0.85],
      [0.40, +1, 0.70, 0.95, -0.70],
      [0.33, -1, 0.62, 0.90, -0.65],
    ];

    // Precompute offset neighborhood for splatting
    let _OFF = [];
    for(let dy = -3; dy <= 3; dy++) {
      for(let dx = -3; dx <= 3; dx++) {
        if(dx * dx + dy * dy <= 9) _OFF.push([dx, dy]);
      }
    }
    _OFF.sort((a, b) => (a[0]*a[0]+a[1]*a[1]) - (b[0]*b[0]+b[1]*b[1]));
    const OFF_X = new Int32Array(_OFF.map(p => p[0]));
    const OFF_Y = new Int32Array(_OFF.map(p => p[1]));
    const D2 = new Float32Array(_OFF.map(p => p[0]*p[0] + p[1]*p[1]));

    function smoothstep(x, a, b) {
      let t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }

    function sinc(x) {
      if (Math.abs(x) < 1e-4) return 1.0;
      let val = x / Math.PI;
      return Math.sin(val) / val;
    }

    function profile(u) {
      let cl = Math.max(0, Math.min(1, u));
      return Math.sin(Math.PI * Math.pow(cl, 0.75));
    }

    function palette_pick(rng, pal, g, spread=0.55, jitter=0.07) {
      let len = g.length;
      let res = new Float32Array(len * 3);
      for(let i=0; i<len; i++) {
        let val = g[i];
        let x = Math.max(0, Math.min(1, val)) * (pal.length - 1) + rng.normal(0, spread);
        let idx = Math.max(0, Math.min(pal.length - 1, Math.round(x)));
        let baseCol = pal[idx];
        for(let c=0; c<3; c++) {
          let jit = 1 + rng.normal(0, jitter);
          res[i*3 + c] = Math.min(255, Math.max(0, baseCol[c] * jit));
        }
      }
      return res;
    }

    function area_u(rng, n) {
      let out = [];
      while(out.length < n) {
        let uArr = new Float32Array(n * 3);
        for(let i=0; i<uArr.length; i++) uArr[i] = rng.next();
        for(let i=0; i<uArr.length && out.length < n; i++) {
          let u = uArr[i];
          if (rng.next() < profile(u)) {
            out.push(u);
          }
        }
      }
      return new Float32Array(out.slice(0, n));
    }

    function sample_v(rng, n, rim=0.14) {
      let v = new Float32Array(n);
      for(let i=0; i<n; i++) {
        v[i] = rng.uniform(-1, 1);
        if (rng.next() < rim) {
          v[i] = Math.sign(v[i]) * rng.uniform(0.88, 1.0);
        }
      }
      return v;
    }

    function permute_dict(d, rng) {
      let n = d.n_items;
      let p = rng.permutation(n);
      let out = { n_items: n };
      for (let key in d) {
        if (key === 'n_items') continue;
        let orig = d[key];
        let stride = orig.length / n;
        if (stride === 1) {
          let res = new Float32Array(n);
          for(let i=0; i<n; i++) res[i] = orig[p[i]];
          out[key] = res;
        } else if (stride === 3) {
          let res = new Float32Array(n * 3);
          for(let i=0; i<n; i++) {
            let pi = p[i];
            res[i*3] = orig[pi*3];
            res[i*3+1] = orig[pi*3+1];
            res[i*3+2] = orig[pi*3+2];
          }
          out[key] = res;
        }
      }
      return out;
    }

    function splat(canvasData, W, H, x, y, col, rad, nmax=13) {
      let count = x.length;
      for (let i = 0; i < count; i++) {
        let xi = Math.round(x[i]);
        let yi = Math.round(y[i]);
        let r = rad[i];
        let r2 = r * r + 0.01;
        let cr = col[i*3];
        let cg = col[i*3+1];
        let cb = col[i*3+2];

        for (let j = 0; j < nmax; j++) {
          let px = xi + OFF_X[j];
          let py = yi + OFF_Y[j];
          if (D2[j] <= r2 && px >= 0 && px < W && py >= 0 && py < H) {
            let idx = (py * W + px) * 4;
            canvasData[idx] = cr;
            canvasData[idx+1] = cg;
            canvasData[idx+2] = cb;
            canvasData[idx+3] = 255;
          }
        }
      }
    }

    class Batch {
      constructor() {
        this.xs = []; this.ys = []; this.cols = []; this.rads = []; this.zs = [];
      }
      add(x, y, col, rad, z) {
        if (x.length === 0) return;
        this.xs.push(x);
        this.ys.push(y);
        this.cols.push(col);
        this.rads.push(rad);
        this.zs.push(z);
      }
      draw(canvasData, W, H) {
        let totalLen = 0;
        for(let arr of this.xs) totalLen += arr.length;
        if (totalLen === 0) return;

        let x = new Float32Array(totalLen);
        let y = new Float32Array(totalLen);
        let col = new Float32Array(totalLen * 3);
        let rad = new Float32Array(totalLen);
        let z = new Float32Array(totalLen);

        let offset = 0;
        for(let k=0; k<this.xs.length; k++) {
          let len = this.xs[k].length;
          x.set(this.xs[k], offset);
          y.set(this.ys[k], offset);
          col.set(this.cols[k], offset * 3);
          rad.set(this.rads[k], offset);
          z.set(this.zs[k], offset);
          offset += len;
        }

        let indices = new Int32Array(totalLen);
        for(let i=0; i<totalLen; i++) indices[i] = i;
        indices.sort((a, b) => z[a] - z[b]);

        let sortedX = new Float32Array(totalLen);
        let sortedY = new Float32Array(totalLen);
        let sortedCol = new Float32Array(totalLen * 3);
        let sortedRad = new Float32Array(totalLen);

        for(let i=0; i<totalLen; i++) {
          let idx = indices[i];
          sortedX[i] = x[idx];
          sortedY[i] = y[idx];
          sortedRad[i] = rad[idx];
          sortedCol[i*3] = Math.min(255, Math.max(0, col[idx*3]));
          sortedCol[i*3+1] = Math.min(255, Math.max(0, col[idx*3+1]));
          sortedCol[i*3+2] = Math.min(255, Math.max(0, col[idx*3+2]));
        }

        splat(canvasData, W, H, sortedX, sortedY, sortedCol, sortedRad);
      }
    }

    function state(t) {
      t = Math.min(Math.max(t, 0.0), T_END);
      let i = 0;
      for (let k = 0; k < KEYS.length - 1; k++) {
        if (t >= KEYS[k][0] && t <= KEYS[k+1][0]) {
          i = k;
          break;
        }
      }
      let ts0 = KEYS[i][0];
      let ts1 = KEYS[i+1][0];
      let u = (t - ts0) / (ts1 - ts0);

      let p0 = KEYS[Math.max(i - 1, 0)].slice(1);
      let p1 = KEYS[i].slice(1);
      let p2 = KEYS[i + 1].slice(1);
      let p3 = KEYS[Math.min(i + 2, KEYS.length - 1)].slice(1);

      let res = new Float32Array(6);
      for(let j=0; j<6; j++) {
        let v = 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u * u
                   + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * u * u * u);
        res[j] = Math.min(1, Math.max(0, v));
      }
      return res;
    }

    function bez(P, s) {
      let P0 = P[0], P1 = P[1], P2 = P[2], P3 = P[3];
      let n = s.length;
      let x = new Float32Array(n);
      let y = new Float32Array(n);
      let dx = new Float32Array(n);
      let dy = new Float32Array(n);

      for(let i=0; i<n; i++) {
        let st = s[i];
        let q = 1 - st;
        x[i] = q*q*q * P0[0] + 3*q*q*st * P1[0] + 3*q*st*st * P2[0] + st*st*st * P3[0];
        y[i] = q*q*q * P0[1] + 3*q*q*st * P1[1] + 3*q*st*st * P2[1] + st*st*st * P3[1];
        dx[i] = 3*q*q * (P1[0] - P0[0]) + 6*q*st * (P2[0] - P1[0]) + 3*st*st * (P3[0] - P2[0]);
        dy[i] = 3*q*q * (P1[1] - P0[1]) + 6*q*st * (P2[1] - P1[1]) + 3*st*st * (P3[1] - P2[1]);
      }
      return [x, y, dx, dy];
    }

    function mixcol(live, wilt, w) {
      let n = live.length / 3;
      let res = new Float32Array(n * 3);
      for(let i=0; i<n; i++) {
        let wi = w[i];
        res[i*3] = live[i*3] + (wilt[i*3] - live[i*3]) * wi;
        res[i*3+1] = live[i*3+1] + (wilt[i*3+1] - live[i*3+1]) * wi;
        res[i*3+2] = live[i*3+2] + (wilt[i*3+2] - live[i*3+2]) * wi;
      }
      return res;
    }

    class Plant {
      constructor(W, H) {
        this.W = W; this.H = H;
        this.rng = new RNG(SEED);
        this.cx = W / 2;
        this.y0 = H * 0.80;
        this.Ls = H * 0.38;
        this.Lf = H * 0.235;
        this.build_soil();
        this.build_stem();
        this.build_head();
        this.build_stamens();
        this.build_leaves();
      }

      surface(x) {
        let H = this.H;
        let res = new Float32Array(x.length);
        for(let i=0; i<x.length; i++) {
          let xi = x[i];
          res[i] = this.y0 - 0.022 * H * Math.exp(-Math.pow((xi - this.cx) / (0.2 * this.W), 2))
                  - 0.003 * H * Math.sin(xi * 0.045) - 0.002 * H * Math.sin(xi * 0.13 + 1.3);
        }
        return res;
      }

      surface_scalar(x) {
        let H = this.H;
        return this.y0 - 0.022 * H * Math.exp(-Math.pow((x - this.cx) / (0.2 * this.W), 2))
                - 0.003 * H * Math.sin(x * 0.045) - 0.002 * H * Math.sin(x * 0.13 + 1.3);
      }

      build_soil() {
        let W = this.W, H = this.H, rng = this.rng;
        let n = 26000;
        let x = new Float32Array(n);
        let y = new Float32Array(n);
        let rad = new Float32Array(n);
        let colRaw = new Float32Array(n);

        let surf = this.surface(Array.from({length: n}, () => rng.uniform(0, W))); // optimized below
        // actually let's fill properly:
        for(let i=0; i<n; i++) {
          x[i] = rng.uniform(0, W);
          let d = Math.pow(rng.random(), 1.5) * 0.14 * H;
          y[i] = this.surface_scalar(x[i]) + d;
          let depth = d / (0.14 * H);
          let edge = Math.pow(Math.min(x[i], W - x[i]) / (0.2 * W), 0.8);
          let clump = 0.5 + 0.5 * Math.sin(x[i] * 0.07 + y[i] * 0.05) * Math.sin(y[i] * 0.11 - x[i] * 0.03);
          let bright = Math.pow(1 - depth, 0.8) * Math.max(0, Math.min(1, edge)) * (0.55 + 0.35 * clump + 0.35 * rng.random());
          colRaw[i] = bright;
          let rRand = rng.random();
          rad[i] = rRand < 0.4 ? 1.0 : (rRand < 0.8 ? 1.5 : 2.0);
        }

        let col = palette_pick(rng, SOIL_PAL, colRaw, 1.0);
        for(let i=0; i<n*3; i++) col[i] *= colRaw[Math.floor(i/3)];

        this.base = new Uint8Array(W * H * 4);
        let soilBatch = new Float32Array(n*3);
        for(let i=0; i<n*3; i++) soilBatch[i] = Math.min(255, Math.max(0, col[i]));
        splat(this.base, W, H, x, y, soilBatch, rad);

        // Pebbles
        let k = 170;
        let px = new Float32Array(k), py = new Float32Array(k), pr = new Float32Array(k), pColRaw = new Float32Array(k);
        for(let i=0; i<k; i++) {
          px[i] = rng.uniform(0.05 * W, 0.95 * W);
          py[i] = this.surface_scalar(px[i]) + Math.pow(rng.random(), 1.3) * 0.1 * H;
          pColRaw[i] = Math.pow(Math.min(px[i], W - px[i]) / (0.2 * W), 0.8);
          pr[i] = rng.random() < 0.6 ? 2.0 : 3.0;
        }
        let pc = palette_pick(rng, [[58, 52, 48], [84, 74, 64], [104, 90, 76], [46, 38, 32]], pColRaw, 0.7);
        for(let i=0; i<k*3; i++) pc[i] *= pColRaw[Math.floor(i/3)];
        splat(this.base, W, H, px, py, pc, pr, 29);

        // Cracks / ground roots
        let m = 520;
        let crx = new Float32Array(m), cry = new Float32Array(m), cramp = new Float32Array(m), crdelay = new Float32Array(m), crrad = new Float32Array(m);
        let crColRaw = new Float32Array(m);
        for(let i=0; i<m; i++) {
          crx[i] = this.cx + rng.normal(0, 0.03 * H);
          cry[i] = this.surface_scalar(crx[i]) - rng.random() * 0.006 * H;
          cramp[i] = H * 0.05 * Math.pow(rng.random(), 2.2);
          crdelay[i] = rng.uniform(0, 2.5);
          crColRaw[i] = rng.uniform(0.3, 1);
          crrad[i] = rng.random() < 0.4 ? 1.0 : (rng.random() < 0.8 ? 1.5 : 2.0);
        }
        let crcol = palette_pick(rng, SOIL_PAL, crColRaw, 0.8);
        for(let i=0; i<m*3; i++) crcol[i] *= 0.8;

        this.cr = { x: crx, y: cry, amp: cramp, delay: crdelay, col: crcol, rad: crrad };
      }

      build_stem() {
        let rng = this.rng, n = 3600;
        let s = new Float32Array(n), lat = new Float32Array(n), rn = new Float32Array(n), rad = new Float32Array(n);
        let liveRaw = new Float32Array(n);
        for(let i=0; i<n; i++) {
          s[i] = rng.random();
          lat[i] = rng.uniform(-1, 1);
          if (rng.random() < 0.18) lat[i] = Math.sign(lat[i]) * rng.uniform(0.85, 1.0);
          liveRaw[i] = s[i] * 0.8 + rng.random() * 0.2;
          rn[i] = rng.random();
          let r = rng.random();
          rad[i] = r < 0.35 ? 1.0 : (r < 0.8 ? 1.5 : 2.0);
        }
        let live = palette_pick(rng, STEM_PAL.slice(0, 3), liveRaw, 0.55);
        for(let i=0; i<n; i++) {
          if (rng.random() < 0.12) {
            let jit = 1 + rng.normal(0, 0.08);
            live[i*3] = STEM_PAL[3][0] * jit;
            live[i*3+1] = STEM_PAL[3][1] * jit;
            live[i*3+2] = STEM_PAL[3][2] * jit;
          }
        }
        let wiltRaw = new Float32Array(n);
        for(let i=0; i<n; i++) wiltRaw[i] = rng.random();
        let wilt = palette_pick(rng, STEM_WILT, wiltRaw, 0.8);

        let d = { n_items: n, s, lat, live, wilt, rn, rad };
        this.stem = permute_dict(d, rng);
      }

      ctrl(L, wilt, sway) {
        let cx = this.cx, y0 = this.y0;
        let P0 = [cx, y0 + 4.0];
        let P1 = [cx - 0.06 * L * (1 - wilt) + 0.02 * L * wilt, y0 - 0.33 * L];
        let P2 = [cx + 0.05 * L * (1 - wilt) + 0.08 * L * wilt + sway * 0.5, y0 - L * (0.74 + 0.30 * wilt)];
        let P3 = [cx + sway + 0.32 * L * wilt, y0 - L * (1 - 0.15 * wilt)];
        return [P0, P1, P2, P3];
      }

      build_head() {
        let rng = this.rng;
        let parts = [];
        for(let Ly of LAYERS) {
          let d = Ly.d;
          for(let i=0; i<Ly.n; i++) {
            let th = 2 * Math.PI * i / Ly.n + Ly.off + rng.normal(0, 0.10);
            let aj = rng.normal(0, 0.06), lj = rng.uniform(0.92, 1.08);
            let pj = rng.random(), wj = rng.uniform(-0.5, 0.5);
            let u = area_u(rng, d);
            let v = sample_v(rng, d);
            let uRand = new Float32Array(d);
            for(let k=0; k<d; k++) uRand[k] = u[k] + rng.normal(0, 0.10);
            let col = palette_pick(rng, Ly.pal, uRand, 0.55);

            for(let k=0; k<d; k++) {
              if (Math.abs(v[k]) > 0.86 && rng.random() < 0.55) {
                let rc = palette_pick(rng, RIM_PAL, new Float32Array([rng.random()]), 0.55);
                col[k*3] = rc[0]; col[k*3+1] = rc[1]; col[k*3+2] = rc[2];
              }
              if (rng.random() < 0.04) {
                let hc = palette_pick(rng, HI_PAL, new Float32Array([rng.random()]), 0.55);
                col[k*3] = hc[0]; col[k*3+1] = hc[1]; col[k*3+2] = hc[2];
              }
              if (rng.random() < 0.02 && u[k] < 0.55) {
                let gc = palette_pick(rng, GOLD_PAL, new Float32Array([rng.random()]), 0.55);
                col[k*3] = gc[0]; col[k*3+1] = gc[1]; col[k*3+2] = gc[2];
              }
            }

            let wiltRaw = new Float32Array(d);
            for(let k=0; k<d; k++) wiltRaw[k] = 0.4 * u[k] + 0.6 * rng.random();
            let wilt = palette_pick(rng, WILT_PAL, wiltRaw, 0.7);

            let thArr = new Float32Array(d); thArr.fill(th);
            let ajArr = new Float32Array(d); ajArr.fill(aj);
            let pjArr = new Float32Array(d); pjArr.fill(pj);
            let wjArr = new Float32Array(d); wjArr.fill(wj);
            let acArr = new Float32Array(d); acArr.fill(Ly.ac);
            let aoArr = new Float32Array(d); aoArr.fill(Ly.ao);
            let kcArr = new Float32Array(d); kcArr.fill(Ly.kc);
            let koArr = new Float32Array(d); koArr.fill(Ly.ko);
            let LArr = new Float32Array(d); LArr.fill(Ly.L * lj);
            let wcArr = new Float32Array(d); wcArr.fill(Ly.wc);
            let woArr = new Float32Array(d); woArr.fill(Ly.wo);
            let rn = new Float32Array(d);
            let rad = new Float32Array(d);
            for(let k=0; k<d; k++) {
              rn[k] = rng.random();
              let r = rng.random();
              rad[k] = r < 0.3 ? 1.0 : (r < 0.75 ? 1.5 : 2.0);
            }

            parts.push({ n_items: d, th: thArr, aj: ajArr, pj: pjArr, wj: wjArr, u, v, ac: acArr, ao: aoArr, kc: kcArr, ko: koArr, L: LArr, wc: wcArr, wo: woArr, live: col, wilt, rn, rad });
          }
        }

        // Concatenate parts
        let totalD = parts.reduce((acc, p) => acc + p.n_items, 0);
        let h = {
          n_items: totalD,
          th: new Float32Array(totalD), aj: new Float32Array(totalD), pj: new Float32Array(totalD), wj: new Float32Array(totalD),
          u: new Float32Array(totalD), v: new Float32Array(totalD), ac: new Float32Array(totalD), ao: new Float32Array(totalD),
          kc: new Float32Array(totalD), ko: new Float32Array(totalD), L: new Float32Array(totalD), wc: new Float32Array(totalD),
          wo: new Float32Array(totalD), live: new Float32Array(totalD * 3), wilt: new Float32Array(totalD * 3),
          rn: new Float32Array(totalD), rad: new Float32Array(totalD), sp: new Float32Array(totalD)
        };

        let off = 0;
        for(let p of parts) {
          let ni = p.n_items;
          h.th.set(p.th, off); h.aj.set(p.aj, off); h.pj.set(p.pj, off); h.wj.set(p.wj, off);
          h.u.set(p.u, off); h.v.set(p.v, off); h.ac.set(p.ac, off); h.ao.set(p.ao, off);
          h.kc.set(p.kc, off); h.ko.set(p.ko, off); h.L.set(p.L, off); h.wc.set(p.wc, off);
          h.wo.set(p.wo, off); h.live.set(p.live, off * 3); h.wilt.set(p.wilt, off * 3);
          h.rn.set(p.rn, off); h.rad.set(p.rad, off);
          off += ni;
        }

        for(let i=0; i<totalD; i++) {
          h.sp[i] = profile(h.u[i]);
        }

        this.head = permute_dict(h, rng);
      }

      build_stamens() {
        let rng = this.rng, n = 700, nf = 60;
        let fid = rng.integers(0, nf, n);
        let t = new Float32Array(n);
        let liveRaw = new Float32Array(n);
        for(let i=0; i<n; i++) {
          t[i] = 1 - Math.pow(rng.random(), 1.6);
          liveRaw[i] = t[i];
        }
        let live = palette_pick(rng, STAMEN_PAL, liveRaw, 0.35);
        let wiltRaw = new Float32Array(n);
        for(let i=0; i<n; i++) wiltRaw[i] = rng.random();
        let wilt = palette_pick(rng, STAMEN_WILT, wiltRaw, 0.6);

        let thPool = new Float32Array(nf);
        let betaPool = new Float32Array(nf);
        let ellPool = new Float32Array(nf);
        for(let i=0; i<nf; i++) {
          thPool[i] = rng.uniform(0, 2 * Math.PI);
          betaPool[i] = rng.uniform(0.2, 0.85);
          ellPool[i] = rng.uniform(0.30, 0.55);
        }

        let th = new Float32Array(n), beta = new Float32Array(n), ell = new Float32Array(n), rad = new Float32Array(n);
        for(let i=0; i<n; i++) {
          let fidx = fid[i];
          th[i] = thPool[fidx];
          beta[i] = betaPool[fidx];
          ell[i] = ellPool[fidx];
          rad[i] = t[i] > 0.88 ? 2.0 : (rng.random() < 0.5 ? 1.0 : 1.5);
        }

        this.st = permute_dict({ n_items: n, th, beta, ell, t, live, wilt, rad }, rng);
      }

      build_leaves() {
        let rng = this.rng, parts = [];
        let d = 900;
        for(let j=0; j<LEAF_DEFS.length; j++) {
          let u = area_u(rng, d);
          let v = sample_v(rng, d, 0.10);
          let lid = new Float32Array(d); lid.fill(j);
          let rn = new Float32Array(d);
          let rad = new Float32Array(d);
          let liveRaw = new Float32Array(d);
          for(let k=0; k<d; k++) {
            u[k] = Math.max(0, Math.min(1, u[k]));
            liveRaw[k] = u[k] + rng.normal(0, 0.1);
            rn[k] = rng.random();
            let r = rng.random();
            rad[k] = r < 0.35 ? 1.0 : (r < 0.8 ? 1.5 : 2.0);
          }
          let live = palette_pick(rng, LEAF_PAL, liveRaw, 0.55);
          let wiltRaw = new Float32Array(d);
          for(let k=0; k<d; k++) wiltRaw[k] = rng.random();
          let wilt = palette_pick(rng, LEAF_WILT, wiltRaw, 0.8);

          for(let k=0; k<d; k++) {
            if (rng.random() < 0.09) {
              v[k] = rng.normal(0, 0.03);
              let rc = palette_pick(rng, RIB_PAL, new Float32Array([rng.random()]), 0.55);
              live[k*3] = rc[0]; live[k*3+1] = rc[1]; live[k*3+2] = rc[2];
            }
          }

          parts.push({ n_items: d, lid, u, v, live, wilt, rn, rad });
        }

        let totalD = parts.reduce((acc, p) => acc + p.n_items, 0);
        let l = {
          n_items: totalD, lid: new Float32Array(totalD), u: new Float32Array(totalD), v: new Float32Array(totalD),
          live: new Float32Array(totalD * 3), wilt: new Float32Array(totalD * 3), rn: new Float32Array(totalD), rad: new Float32Array(totalD)
        };
        let off = 0;
        for(let p of parts) {
          l.lid.set(p.lid, off); l.u.set(p.u, off); l.v.set(p.v, off);
          l.live.set(p.live, off * 3); l.wilt.set(p.wilt, off * 3);
          l.rn.set(p.rn, off); l.rad.set(p.rad, off);
          off += p.n_items;
        }
        this.leaf = permute_dict(l, rng);
      }

      render(t) {
        let H = this.H, W = this.W;
        let [stem, size, bloom, wilt, leaf] = state(t);
        let canvas = new Uint8Array(this.base); // copy base
        let B = new Batch();
        let Lf = this.Lf;

        let L = this.Ls * stem;
        let sway = 0.012 * H * Math.sin(t * 0.9) * stem * (1 - 0.6 * wilt);
        let P = this.ctrl(L, wilt, sway);
        let hx = P[3][0], hy = P[3][1];

        if (stem > 0.01) {
          let S = this.stem;
          let nv = Math.floor(S.n_items * Math.max(0.08, Math.min(stem, 1)));
          let s = S.s.subarray(0, nv);
          let [x, y, dx, dy] = bez(P, s);
          let nn = new Float32Array(nv);
          let lat = new Float32Array(nv);
          let wstArr = new Float32Array(nv);
          let wiArr = new Float32Array(nv);

          for(let i=0; i<nv; i++) {
            let len = Math.hypot(dx[i], dy[i]) + 1e-6;
            nn[i] = len;
            let wst = 0.0085 * H * (1 - 0.3 * s[i]) * (1 - 0.25 * wilt) * Math.max(0.4, Math.min(1, 0.4 + stem * 1.2));
            lat[i] = S.lat[i] * wst;
            let wVal = wilt * (0.75 + 0.5 * s[i]) * (0.7 + 0.5 * S.rn[i]);
            wiArr[i] = Math.max(0, Math.min(1, wVal));
          }

          let sx = new Float32Array(nv), sy = new Float32Array(nv);
          for(let i=0; i<nv; i++) {
            sx[i] = x[i] - dy[i] / nn[i] * lat[i];
            sy[i] = y[i] + dx[i] / nn[i] * lat[i];
          }

          let scol = mixcol(S.live.subarray(0, nv*3), S.wilt.subarray(0, nv*3), wiArr);
          let sz = new Float32Array(nv); sz.fill(-500.0);
          B.add(sx, sy, scol, S.rad.subarray(0, nv), sz);
        }

        if (leaf > 0.02 && stem > 0.05) {
          let S = this.leaf;
          let nv = Math.floor(S.n_items * Math.max(0.15, Math.min(leaf, 1)));
          let sa = new Float32Array(LEAF_DEFS.length);
          for(let i=0; i<LEAF_DEFS.length; i++) sa[i] = LEAF_DEFS[i][0];
          let [ax, ay] = bez(P, sa).slice(0, 2);

          let lid = S.lid.subarray(0, nv);
          let u = S.u.subarray(0, nv), v = S.v.subarray(0, nv);
          let X = new Float32Array(nv), Yup = new Float32Array(nv);
          let ayArr = new Float32Array(nv);
          let wiArr = new Float32Array(nv);

          for(let i=0; i<nv; i++) {
            let ldi = Math.round(lid[i]);
            let def = LEAF_DEFS[ldi];
            let m = def[1], lfac = def[2], a0_base = def[3], c_base = def[4];
            let a0 = a0_base + (1 - leaf) * 0.8 - 0.6 * wilt;
            let c = c_base - 0.5 * wilt;
            let LL = 0.19 * H * lfac * leaf * (1 - 0.25 * wilt);
            let ui = u[i], vi = v[i];

            let am = a0 + c * ui * 0.5;
            let al = a0 + c * ui;
            let sc = sinc(c * ui * 0.5);
            let lat = vi * 0.27 * LL * profile(ui);

            let axi = ax[ldi], ayi = ay[ldi];
            X[i] = axi + LL * ui * m * Math.cos(am) * sc - lat * Math.sin(al);
            let yupVal = LL * ui * Math.sin(am) * sc + lat * m * Math.cos(al);
            Yup[i] = ayi - yupVal;

            let wVal = wilt * (0.9 + 0.5 * ui + 0.3 * S.rn[i]) - 0.1;
            wiArr[i] = Math.max(0, Math.min(1, wVal));
          }

          let lcol = mixcol(S.live.subarray(0, nv*3), S.wilt.subarray(0, nv*3), wiArr);
          let lz = new Float32Array(nv); lz.fill(-450.0);
          B.add(X, Yup, lcol, S.rad.subarray(0, nv), lz);
        }

        if (stem > 0.01 && size > 0.05) {
          let phi = wilt * 2.75 + 0.035 * Math.sin(t * 0.9 + 1.0) * (1 - wilt);
          let tau = 0.20 + 0.36 * bloom - 0.40 * wilt;
          let cphi = Math.cos(phi), sphi = Math.sin(phi), ct = Math.cos(tau), st_ = Math.sin(tau);
          let Ls_ = Lf * size;

          function project(xl, yl, zl) {
            let yp = yl * ct - zl * st_;
            let zp = yl * st_ + zl * ct;
            return [hx + xl * cphi + yp * sphi, hy - (-xl * sphi + yp * cphi), zp, yp];
          }

          let vis = Math.max(0.2, Math.min(1.0, size * size * 1.15));
          let h = this.head;
          let nv = Math.floor(h.n_items * vis);
          let u = h.u.subarray(0, nv), v = h.v.subarray(0, nv);

          let X = new Float32Array(nv), Y = new Float32Array(nv), zpArr = new Float32Array(nv);
          let shadeArr = new Float32Array(nv), wiArr = new Float32Array(nv);

          for(let i=0; i<nv; i++) {
            let ui = u[i], vi = v[i];
            let A0 = h.ac[i] + (h.ao[i] - h.ac[i]) * bloom + h.aj[i];
            A0 = A0 * (1 - 0.55 * wilt) + wilt * h.wj[i] * 0.3;
            let K = h.kc[i] + (h.ko[i] - h.kc[i]) * bloom + wilt * (0.6 + 0.6 * h.pj[i]);
            let Lp = Ls_ * h.L[i] * (1 - 0.28 * wilt * h.pj[i]);

            let am = A0 + K * ui * 0.5;
            let sc = sinc(K * ui * 0.5);
            let rr = Lp * ui * Math.sin(am) * sc;
            let hh = Lp * ui * Math.cos(am) * sc;
            let lat = vi * (h.wc[i] + (h.wo[i] - h.wc[i]) * bloom) * Lp * h.sp[i];
            rr = rr + 0.025 * Ls_ - 0.5 * lat * lat / (Lp + 1.0);

            let cth = Math.cos(h.th[i]), sth = Math.sin(h.th[i]);
            let [px, py, pzp] = project(cth * rr - sth * lat, hh, sth * rr + cth * lat);
            X[i] = px; Y[i] = py; zpArr[i] = pzp;

            let shade = Math.max(0.5, Math.min(1.2, 0.72 + 0.28 * Math.max(0, Math.min(1, pzp / Ls_ * 0.5 + 0.5)) + 0.12 * (hh / Ls_)));
            shadeArr[i] = shade;

            let wVal = wilt * (1.0 + 0.7 * ui + 0.4 * h.rn[i]) - 0.2;
            wiArr[i] = Math.max(0, Math.min(1, wVal));
          }

          let hcol = mixcol(h.live.subarray(0, nv*3), h.wilt.subarray(0, nv*3), wiArr);
          for(let i=0; i<nv; i++) {
            let sh = shadeArr[i];
            hcol[i*3] *= sh; hcol[i*3+1] *= sh; hcol[i*3+2] *= sh;
          }
          B.add(X, Y, hcol, h.rad.subarray(0, nv), zpArr);

          let ss = smoothstep(bloom, 0.30, 0.85);
          if (ss > 0.02) {
            let S = this.st;
            let nv2 = Math.floor(S.n_items * Math.max(0.25, Math.min(size * size, 1)));
            let stX = new Float32Array(nv2), stY = new Float32Array(nv2), stZ = new Float32Array(nv2);
            for(let i=0; i<nv2; i++) {
              let ell = Ls_ * ss * S.ell[i];
              let beta = S.beta[i] * (0.6 + 0.4 * bloom) + wilt * 0.3;
              let r = ell * S.t[i] * Math.sin(beta) + 0.02 * Ls_;
              let yl = 0.05 * Ls_ + ell * S.t[i] * Math.cos(beta);
              let [px, py, pzp] = project(Math.cos(S.th[i]) * r, yl, Math.sin(S.th[i]) * r);
              stX[i] = px; stY[i] = py; stZ[i] = pzp + 3.0;
            }
            let stW = new Float32Array(nv2); stW.fill(wilt);
            let stCol = mixcol(S.live.subarray(0, nv2*3), S.wilt.subarray(0, nv2*3), stW);
            B.add(stX, stY, stCol, S.rad.subarray(0, nv2), stZ);
          }
        }

        B.draw(canvas, W, H);

        let C = this.cr;
        let cm = C.x.length;
        let cX = new Float32Array(cm), cY = new Float32Array(cm);
        for(let i=0; i<cm; i++) {
          let e = Math.max(0, Math.min(1, (t - C.delay[i]) / 3.0));
          cY[i] = C.y[i] - C.amp[i] * Math.sin(Math.PI * e);
          cX[i] = C.x[i];
        }
        splat(canvas, W, H, cX, cY, C.col, C.rad);

        return canvas;
      }
    }

    // --- Main Application ---
    const canvas = document.getElementById('cv');
    const ctx = canvas.getContext('2d');
    const timeDisplay = document.getElementById('time-display');

    let dim = 600;
    canvas.width = dim;
    canvas.height = dim;

    try {
        const plant = new Plant(dim, dim);
        console.log("Plant created successfully, base size:", plant.base?.length, "type:", plant.base?.constructor?.name);

        // First render at t=0 to check what we get
        try {
            let initial = plant.render(0.0);
            console.log("Initial render at t=0, length:", initial?.length, "type:", initial?.constructor?.name);
            if (initial && initial.length > 0) {
                // Check first few and last few values
                console.log("First 5 values:", Array.from(initial.slice(0, 5)));
                console.log("Last 5 values:", Array.from(initial.slice(-5)));
                // Check if all zeros
                let allZero = initial.every(v => v === 0);
                console.log("All values zero at t=0:", allZero);
                // Check if all 255
                let all255 = initial.every(v => v === 255);
                console.log("All values 255 at t=0:", all255);
            }
        } catch(e) {
            console.error("Error in initial render:", e);
        }

        // Also test state() directly
        try {
            let s = state(0.0);
            console.log("state(0.0) =", Array.from(s));
        } catch(e) {
            console.error("Error in state(0.0):", e);
        }

        let clock = 12.0;  // Start at mid-growth where plant is fully visible and blooming
        let lastTime = performance.now();
        let paused = false;

        const pauseBtn = document.getElementById('pause-btn');
        const restartBtn = document.getElementById('restart-btn');

        function updatePauseBtn() {
            pauseBtn.textContent = paused ? 'Play' : 'Pause';
        }

        function loop(now) {
            let dt = (now - lastTime) / 1000;
            lastTime = now;

            if (!paused) {
                clock += dt * TIME_SCALE;
                if (LOOP && clock > T_END) {
                    clock = 0.0;
                }
            }

            // Ensure clock stays in valid range
            if (clock < 0) clock = 0;
            if (!LOOP && clock > T_END) clock = T_END;

            try {
                let imgDataArray = plant.render(clock);
                // Clip data to valid range
                let clamped = new Uint8ClampedArray(imgDataArray.length);
                for (let i = 0; i < imgDataArray.length; i++) {
                    clamped[i] = Math.max(0, Math.min(255, imgDataArray[i]));
                }
                let imgData = new ImageData(clamped, dim, dim);
                ctx.putImageData(imgData, 0, 0);
            } catch(e) {
                console.error("Error in render loop at clock=" + clock + ":", e);
            }

            requestAnimationFrame(loop);
        }

        pauseBtn.addEventListener('click', () => {
            paused = !paused;
            updatePauseBtn();
        });

        restartBtn.addEventListener('click', () => {
            clock = 0.0;
            if (paused) {
                paused = false;
                updatePauseBtn();
            }
        });

        // Keyboard controls (still work as shortcuts)
        window.addEventListener('keydown', (e) => {
          if (e.code === 'Space') {
            e.preventDefault();
            paused = !paused;
            updatePauseBtn();
          } else if (e.code === 'KeyR') {
            clock = 0.0;
            if (paused) {
                paused = false;
                updatePauseBtn();
            }
          }
        });

        // Start animation loop
        updatePauseBtn();
        requestAnimationFrame((now) => {
            lastTime = now;
            requestAnimationFrame(loop);
        });
    } catch(e) {
        console.error("Application error:", e);
        document.body.textContent = "Error: " + e.message;
    }