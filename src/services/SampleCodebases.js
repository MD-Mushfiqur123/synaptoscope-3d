/**
 * SynaptoScope 3D - Sample Codebases
 * Author: Md Mushfiqur Rahim (@MD-Mushfiqur123)
 * Provides pre-bundled, zero-setup interactive codebases for instant 3D exploration.
 */

export const SAMPLE_CODEBASES = {
  'MD-Mushfiqur123/orion-space': {
    name: 'MD-Mushfiqur123/orion-space',
    label: 'Orion Space AI Engine (by Mushfiqur)',
    description: 'Neural swarm orchestration & 3D cosmos visualization core created by Md Mushfiqur Rahim.',
    stars: 1420,
    forks: 380,
    language: 'JavaScript / GLSL',
    files: [
      {
        path: 'src/index.js',
        size: 2450,
        loc: 85,
        language: 'javascript',
        content: `import { OrionEngine } from './core/OrionEngine.js';
import { NeuralSwarm } from './ai/NeuralSwarm.js';
import { CosmosRenderer } from './render/CosmosRenderer.js';
import { AudioSynthesizer } from './audio/AudioSynthesizer.js';
import { TelemetryStream } from './telemetry/TelemetryStream.js';

console.log("🌌 Initializing Orion Space AI Engine by Md Mushfiqur Rahim...");

export async function bootstrap() {
  const telemetry = new TelemetryStream({ rate: 60 });
  const audio = new AudioSynthesizer({ masterGain: 0.8 });
  const swarm = new NeuralSwarm({ agentCount: 128, consensus: 'byzantine' });
  const renderer = new CosmosRenderer(document.getElementById('canvas-container'));
  
  const engine = new OrionEngine({
    swarm,
    renderer,
    telemetry,
    audio
  });

  await engine.start();
  return engine;
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrap);
}
`
      },
      {
        path: 'src/core/OrionEngine.js',
        size: 4200,
        loc: 142,
        language: 'javascript',
        content: `import { Vector3, Matrix4 } from '../math/SpatialMath.js';
import { NeuralSwarm } from '../ai/NeuralSwarm.js';
import { CosmosRenderer } from '../render/CosmosRenderer.js';
import { ConfigManager } from '../utils/ConfigManager.js';

export class OrionEngine {
  constructor(options = {}) {
    this.swarm = options.swarm;
    this.renderer = options.renderer;
    this.telemetry = options.telemetry;
    this.audio = options.audio;
    this.isRunning = false;
    this.tick = 0;
  }

  async start() {
    this.isRunning = true;
    this.telemetry.logEvent('ENGINE_STARTED', { timestamp: Date.now() });
    this.audio?.playChime('START');
    this.loop();
  }

  loop() {
    if (!this.isRunning) return;
    this.tick++;
    this.swarm.step(0.016);
    this.renderer.render(this.swarm.getAgentPositions());
    requestAnimationFrame(() => this.loop());
  }

  stop() {
    this.isRunning = false;
    this.telemetry.logEvent('ENGINE_STOPPED');
  }
}
`
      },
      {
        path: 'src/ai/NeuralSwarm.js',
        size: 5120,
        loc: 178,
        language: 'javascript',
        content: `import { AgentMemory } from './AgentMemory.js';
import { ByzantineConsensus } from './ByzantineConsensus.js';
import { Vector3 } from '../math/SpatialMath.js';

export class NeuralSwarm {
  constructor(config = {}) {
    this.agentCount = config.agentCount || 64;
    this.consensus = new ByzantineConsensus();
    this.agents = [];
    this.initAgents();
  }

  initAgents() {
    for (let i = 0; i < this.agentCount; i++) {
      this.agents.push({
        id: \`agent_\${i}\`,
        position: new Vector3((Math.random() - 0.5) * 100, Math.random() * 50, (Math.random() - 0.5) * 100),
        velocity: new Vector3(0, 0, 0),
        memory: new AgentMemory(32)
      });
    }
  }

  step(dt) {
    const proposals = this.agents.map(a => a.memory.getVectorState());
    const agreedState = this.consensus.resolve(proposals);
    
    this.agents.forEach(agent => {
      agent.position.add(agent.velocity.multiplyScalar(dt));
    });
  }

  getAgentPositions() {
    return this.agents.map(a => a.position);
  }
}
`
      },
      {
        path: 'src/ai/AgentMemory.js',
        size: 3100,
        loc: 96,
        language: 'javascript',
        content: `import { HNSWVectorIndex } from '../math/HNSWVectorIndex.js';

export class AgentMemory {
  constructor(capacity = 64) {
    this.capacity = capacity;
    this.index = new HNSWVectorIndex(128);
    this.buffer = [];
  }

  store(experience) {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(experience);
    this.index.insert(experience.vector, experience.id);
  }

  getVectorState() {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : [0, 0, 0];
  }
}
`
      },
      {
        path: 'src/ai/ByzantineConsensus.js',
        size: 2900,
        loc: 88,
        language: 'javascript',
        content: `import { HashUtils } from '../utils/HashUtils.js';

export class ByzantineConsensus {
  constructor(faultTolerance = 0.33) {
    this.faultTolerance = faultTolerance;
    this.round = 0;
  }

  resolve(proposals) {
    this.round++;
    const total = proposals.length;
    const quorum = Math.floor(total * (1 - this.faultTolerance));
    return {
      round: this.round,
      quorumMet: total >= quorum,
      consensusHash: HashUtils.sha256(JSON.stringify(proposals.slice(0, 5)))
    };
  }
}
`
      },
      {
        path: 'src/render/CosmosRenderer.js',
        size: 6400,
        loc: 215,
        language: 'javascript',
        content: `import { StarfieldPass } from './StarfieldPass.js';
import { BloomShader } from './shaders/BloomShader.js';
import { HologramMaterial } from './materials/HologramMaterial.js';

export class CosmosRenderer {
  constructor(container) {
    this.container = container;
    this.starfield = new StarfieldPass(5000);
    this.bloom = new BloomShader({ intensity: 1.5 });
    this.hologram = new HologramMaterial();
  }

  render(positions) {
    this.starfield.update();
    // Render cosmos nodes with holographic glow
  }
}
`
      },
      {
        path: 'src/render/StarfieldPass.js',
        size: 2100,
        loc: 72,
        language: 'javascript',
        content: `import { Vector3 } from '../math/SpatialMath.js';

export class StarfieldPass {
  constructor(count = 2000) {
    this.count = count;
    this.particles = [];
  }

  update() {
    // Rotate background celestial sphere
  }
}
`
      },
      {
        path: 'src/render/shaders/BloomShader.js',
        size: 1950,
        loc: 64,
        language: 'glsl',
        content: `uniform sampler2D tDiffuse;
uniform float bloomStrength;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  vec4 glow = color * bloomStrength * vec4(0.0, 0.94, 1.0, 1.0);
  gl_FragColor = color + glow;
}
`
      },
      {
        path: 'src/render/materials/HologramMaterial.js',
        size: 2300,
        loc: 78,
        language: 'javascript',
        content: `import { BloomShader } from '../shaders/BloomShader.js';

export class HologramMaterial {
  constructor(color = '#00f0ff') {
    this.color = color;
    this.scanlineSpeed = 1.2;
  }
}
`
      },
      {
        path: 'src/math/SpatialMath.js',
        size: 3800,
        loc: 130,
        language: 'javascript',
        content: `export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
  multiplyScalar(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
  distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
}

export class Matrix4 {
  constructor() {
    this.elements = new Float32Array(16);
  }
}
`
      },
      {
        path: 'src/math/HNSWVectorIndex.js',
        size: 4500,
        loc: 155,
        language: 'javascript',
        content: `import { Vector3 } from './SpatialMath.js';

export class HNSWVectorIndex {
  constructor(dimension = 128) {
    this.dimension = dimension;
    this.nodes = new Map();
  }

  insert(vector, id) {
    this.nodes.set(id, vector);
  }

  searchNearest(queryVector, k = 5) {
    return Array.from(this.nodes.entries()).slice(0, k);
  }
}
`
      },
      {
        path: 'src/audio/AudioSynthesizer.js',
        size: 3400,
        loc: 110,
        language: 'javascript',
        content: `export class AudioSynthesizer {
  constructor(options = {}) {
    this.ctx = null;
    this.masterGain = options.masterGain || 0.5;
    this.isMuted = false;
  }

  init() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx && !this.ctx) {
      this.ctx = new AudioCtx();
    }
  }

  playChime(type = 'SELECT') {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.setValueAtTime(type === 'START' ? 880 : 440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}
`
      },
      {
        path: 'src/telemetry/TelemetryStream.js',
        size: 2100,
        loc: 70,
        language: 'javascript',
        content: `export class TelemetryStream {
  constructor(config = {}) {
    this.rate = config.rate || 60;
    this.events = [];
  }

  logEvent(eventName, payload = {}) {
    this.events.push({ eventName, payload, time: Date.now() });
  }
}
`
      },
      {
        path: 'src/utils/ConfigManager.js',
        size: 1800,
        loc: 60,
        language: 'javascript',
        content: `export class ConfigManager {
  static get(key, defaultVal) {
    return localStorage.getItem(key) || defaultVal;
  }
  static set(key, val) {
    localStorage.setItem(key, val);
  }
}
`
      },
      {
        path: 'src/utils/HashUtils.js',
        size: 1600,
        loc: 52,
        language: 'javascript',
        content: `export class HashUtils {
  static sha256(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString(16);
  }
}
`
      },
      {
        path: 'README.md',
        size: 1500,
        loc: 45,
        language: 'markdown',
        content: `# Orion Space AI Engine
> Built with high precision by **Md Mushfiqur Rahim** ([@MD-Mushfiqur123](https://github.com/MD-Mushfiqur123)).

## Features
- Neural Swarm Byzantine Consensus
- 3D Holographic Rendering Engine
- HNSW Vector Indexing
- High-frequency Web Audio Synthesizer
`
      },
      {
        path: 'package.json',
        size: 920,
        loc: 30,
        language: 'json',
        content: `{
  "name": "orion-space",
  "version": "2.4.0",
  "author": "Md Mushfiqur Rahim <github.com/MD-Mushfiqur123>",
  "type": "module",
  "dependencies": {
    "three": "^0.170.0"
  }
}
`
      }
    ]
  },

  'facebook/react': {
    name: 'facebook/react',
    label: 'React Core Engine (Meta)',
    description: 'The library for web and native user interfaces with virtual DOM reconciliation.',
    stars: 228000,
    forks: 46000,
    language: 'JavaScript / TypeScript',
    files: [
      {
        path: 'packages/react/index.js',
        size: 3200,
        loc: 110,
        language: 'javascript',
        content: `import { createElement, cloneElement, isValidElement } from './src/ReactElement.js';
import { useState, useEffect, useMemo, useCallback } from './src/ReactHooks.js';
import { Component, PureComponent } from './src/ReactBaseClasses.js';
import { ReactSharedInternals } from './src/ReactSharedInternals.js';

export {
  createElement,
  cloneElement,
  isValidElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
  Component,
  PureComponent,
  ReactSharedInternals
};
`
      },
      {
        path: 'packages/react/src/ReactElement.js',
        size: 4800,
        loc: 165,
        language: 'javascript',
        content: `import { REACT_ELEMENT_TYPE } from './ReactSymbols.js';
import { ReactSharedInternals } from './ReactSharedInternals.js';

export function createElement(type, config, children) {
  let propName;
  const props = {};
  let key = null;
  let ref = null;

  if (config != null) {
    if (config.key !== undefined) key = '' + config.key;
    if (config.ref !== undefined) ref = config.ref;
    for (propName in config) {
      if (Object.prototype.hasOwnProperty.call(config, propName) && propName !== 'key' && propName !== 'ref') {
        props[propName] = config[propName];
      }
    }
  }

  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type,
    key,
    ref,
    props
  };
}
`
      },
      {
        path: 'packages/react/src/ReactHooks.js',
        size: 3900,
        loc: 135,
        language: 'javascript',
        content: `import { ReactSharedInternals } from './ReactSharedInternals.js';

function resolveDispatcher() {
  const dispatcher = ReactSharedInternals.ReactCurrentDispatcher.current;
  if (!dispatcher) {
    throw new Error("Invalid hook call.");
  }
  return dispatcher;
}

export function useState(initialState) {
  return resolveDispatcher().useState(initialState);
}

export function useEffect(create, deps) {
  return resolveDispatcher().useEffect(create, deps);
}

export function useMemo(create, deps) {
  return resolveDispatcher().useMemo(create, deps);
}

export function useCallback(callback, deps) {
  return resolveDispatcher().useCallback(callback, deps);
}
`
      },
      {
        path: 'packages/react/src/ReactBaseClasses.js',
        size: 2600,
        loc: 90,
        language: 'javascript',
        content: `export class Component {
  constructor(props, context, updater) {
    this.props = props;
    this.context = context;
    this.updater = updater;
  }
  setState(partialState, callback) {
    this.updater.enqueueSetState(this, partialState, callback);
  }
}

export class PureComponent extends Component {
  isPureReactComponent = true;
}
`
      },
      {
        path: 'packages/react/src/ReactSharedInternals.js',
        size: 1400,
        loc: 48,
        language: 'javascript',
        content: `export const ReactSharedInternals = {
  ReactCurrentDispatcher: { current: null },
  ReactCurrentBatchConfig: { transition: null }
};
`
      },
      {
        path: 'packages/react/src/ReactSymbols.js',
        size: 1100,
        loc: 35,
        language: 'javascript',
        content: `export const REACT_ELEMENT_TYPE = Symbol.for('react.element');
export const REACT_PORTAL_TYPE = Symbol.for('react.portal');
export const REACT_FRAGMENT_TYPE = Symbol.for('react.fragment');
`
      },
      {
        path: 'packages/react-reconciler/src/ReactFiber.js',
        size: 5800,
        loc: 195,
        language: 'javascript',
        content: `import { REACT_ELEMENT_TYPE } from '../../react/src/ReactSymbols.js';
import { createFiberRoot } from './ReactFiberRoot.js';
import { ConcurrentMode } from './ReactTypeOfMode.js';

export function createFiber(tag, pendingProps, key, mode) {
  return {
    tag,
    key,
    elementType: null,
    type: null,
    stateNode: null,
    child: null,
    sibling: null,
    return: null,
    pendingProps,
    memoizedProps: null,
    memoizedState: null,
    mode
  };
}
`
      },
      {
        path: 'packages/react-reconciler/src/ReactFiberRoot.js',
        size: 3200,
        loc: 105,
        language: 'javascript',
        content: `import { ConcurrentMode } from './ReactTypeOfMode.js';

export function createFiberRoot(containerInfo, tag) {
  return {
    containerInfo,
    current: null,
    finishedWork: null,
    tag
  };
}
`
      },
      {
        path: 'packages/react-reconciler/src/ReactTypeOfMode.js',
        size: 900,
        loc: 28,
        language: 'javascript',
        content: `export const NoMode = 0b0000;
export const ConcurrentMode = 0b0001;
export const ProfileMode = 0b0010;
`
      }
    ]
  },

  'torvalds/linux': {
    name: 'torvalds/linux',
    label: 'Linux Kernel Core (Linus Torvalds)',
    description: 'The Linux kernel source tree, virtual memory subsystem, and scheduler.',
    stars: 184000,
    forks: 54000,
    language: 'C / Assembly',
    files: [
      {
        path: 'init/main.c',
        size: 6100,
        loc: 230,
        language: 'c',
        content: `#include <linux/init.h>
#include <linux/sched.h>
#include <linux/mm.h>
#include <linux/kernel.h>

asmlinkage __visible void __init __no_sanitize_address start_kernel(void)
{
    char *command_line;
    char *after_dashes;

    set_task_stack_end_magic(&init_task);
    smp_setup_processor_id();
    
    pr_notice("%s", linux_banner);
    setup_arch(&command_line);
    mm_init();
    sched_init();
    rest_init();
}
`
      },
      {
        path: 'kernel/sched/core.c',
        size: 8900,
        loc: 310,
        language: 'c',
        content: `#include <linux/sched.h>
#include <linux/sched/task.h>
#include <linux/mm.h>

void __sched schedule(void)
{
    struct task_struct *prev = current;
    sched_submit_work(prev);
    __schedule(SM_NONE);
}

void sched_init(void)
{
    int i;
    for_each_possible_cpu(i) {
        struct rq *rq = cpu_rq(i);
        raw_spin_lock_init(&rq->lock);
        rq->nr_running = 0;
    }
}
`
      },
      {
        path: 'mm/page_alloc.c',
        size: 9400,
        loc: 340,
        language: 'c',
        content: `#include <linux/mm.h>
#include <linux/swap.h>
#include <linux/interrupt.h>

struct page * __alloc_pages(gfp_t gfp_mask, unsigned int order, int preferred_nid, nodemask_t *nodemask)
{
    struct page *page;
    unsigned int alloc_flags = ALLOC_WMARK_LOW;
    
    page = get_page_from_freelist(gfp_mask, order, alloc_flags);
    if (page)
        return page;
        
    return __alloc_pages_slowpath(gfp_mask, order);
}
`
      },
      {
        path: 'include/linux/mm.h',
        size: 4200,
        loc: 150,
        language: 'c',
        content: `#ifndef _LINUX_MM_H
#define _LINUX_MM_H

#include <linux/kernel.h>

struct page {
    unsigned long flags;
    atomic_t _refcount;
    unsigned int _mapcount;
};

extern void mm_init(void);
extern struct page * __alloc_pages(unsigned int gfp_mask, unsigned int order, int nid, void *mask);

#endif
`
      },
      {
        path: 'include/linux/sched.h',
        size: 5300,
        loc: 180,
        language: 'c',
        content: `#ifndef _LINUX_SCHED_H
#define _LINUX_SCHED_H

#include <linux/kernel.h>

struct task_struct {
    volatile long state;
    void *stack;
    int prio;
    int static_prio;
    unsigned int policy;
};

extern void schedule(void);
extern void sched_init(void);

#endif
`
      },
      {
        path: 'include/linux/kernel.h',
        size: 2800,
        loc: 95,
        language: 'c',
        content: `#ifndef _LINUX_KERNEL_H
#define _LINUX_KERNEL_H

#define pr_notice(fmt, ...) printk(KERN_NOTICE fmt, ##__VA_ARGS__)
#define ALIGN(x, a) (((x) + (a) - 1) & ~((a) - 1))

#endif
`
      },
      {
        path: 'Makefile',
        size: 2200,
        loc: 85,
        language: 'makefile',
        content: `VERSION = 6
PATCHLEVEL = 8
SUBLEVEL = 0
EXTRAVERSION = -synaptoscope

NAME = SynaptoScope-CyberLinux
`
      }
    ]
  }
};
