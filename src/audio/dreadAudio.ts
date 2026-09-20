/** Subtle dread bed — low drone, wet clicks, distant wrong voices. Hit spikes + flatline. */

export class DreadAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private drone: OscillatorNode | null = null
  private started = false
  private clickTimer: number | null = null
  private voiceTimer: number | null = null
  private aggression = 0
  private heartTimer: number | null = null
  private bpm = 56
  private heartOn = false

  async ensure(): Promise<void> {
    if (this.started && this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume()
      return
    }
    const ctx = new AudioContext()
    this.ctx = ctx
    this.master = ctx.createGain()
    this.master.gain.value = 0.0
    this.master.connect(ctx.destination)

    const g1 = ctx.createGain()
    g1.gain.value = 0.15
    const o1 = ctx.createOscillator()
    o1.type = 'sine'
    o1.frequency.value = 46
    o1.connect(g1)

    const o2 = ctx.createOscillator()
    o2.type = 'triangle'
    o2.frequency.value = 49.5
    const g2 = ctx.createGain()
    g2.gain.value = 0.08
    o2.connect(g2)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 180
    g1.connect(filter)
    g2.connect(filter)

    const droneGain = ctx.createGain()
    droneGain.gain.value = 1
    filter.connect(droneGain)
    droneGain.connect(this.master)

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.04
    lfo.connect(lfoGain)
    lfoGain.connect(this.master.gain)

    o1.start()
    o2.start()
    lfo.start()
    this.drone = o1
    this.started = true

    this.master.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.6)
    this.scheduleClicks()
    this.scheduleVoices()
  }

  setPresence(active: boolean, aggression = 0) {
    this.aggression = aggression
    if (!this.ctx || !this.master) return
    const target = active ? 0.16 + aggression * 0.28 : 0.04
    this.master.gain.cancelScheduledValues(this.ctx.currentTime)
    this.master.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.4)
    if (this.drone) {
      this.drone.frequency.setTargetAtTime(
        46 + aggression * 18,
        this.ctx.currentTime,
        0.5,
      )
    }
  }

  /** Soft thump synced to UI BPM while ghost is present / fear rising. */
  setHeartbeat(bpm: number, active: boolean) {
    this.bpm = Math.max(40, Math.min(200, bpm))
    this.heartOn = active
    if (!active) {
      if (this.heartTimer) {
        clearTimeout(this.heartTimer)
        this.heartTimer = null
      }
      return
    }
    if (!this.heartTimer) this.scheduleHeart()
  }

  private scheduleHeart() {
    const tick = () => {
      if (!this.heartOn || !this.ctx || !this.master) {
        this.heartTimer = null
        return
      }
      this.thump()
      const interval = 60000 / this.bpm
      this.heartTimer = window.setTimeout(tick, interval)
    }
    this.heartTimer = window.setTimeout(tick, 200)
  }

  private thump() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 55
    const g = this.ctx.createGain()
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(this.master)
    const vol = 0.05 + this.aggression * 0.09
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o.frequency.exponentialRampToValueAtTime(32, t + 0.1)
    o.start(t)
    o.stop(t + 0.14)
  }

  /** Melee strike — wet impact, bone-click, whisper-scream spike. */
  playHit() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const ctx = this.ctx
    // Wet impact noise
    const noise = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.06))
    }
    noise.buffer = buf
    const g = ctx.createGain()
    g.gain.value = 0.42
    const f = ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 280
    f.Q.value = 0.7
    noise.connect(f)
    f.connect(g)
    g.connect(this.master)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
    noise.start(t)
    noise.stop(t + 0.22)
    // Bone click
    const click = ctx.createOscillator()
    click.type = 'square'
    click.frequency.value = 880
    const cg = ctx.createGain()
    cg.gain.value = 0.0001
    const cf = ctx.createBiquadFilter()
    cf.type = 'bandpass'
    cf.frequency.value = 1400
    cf.Q.value = 8
    click.connect(cf)
    cf.connect(cg)
    cg.connect(this.master)
    cg.gain.exponentialRampToValueAtTime(0.14, t + 0.008)
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
    click.start(t)
    click.stop(t + 0.07)
    // Body thud
    const o = ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = 70
    const og = ctx.createGain()
    og.gain.value = 0.0001
    o.connect(og)
    og.connect(this.master)
    og.gain.exponentialRampToValueAtTime(0.2, t + 0.01)
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
    o.frequency.exponentialRampToValueAtTime(28, t + 0.25)
    o.start(t)
    o.stop(t + 0.3)
    // Whisper scream formant
    const scream = ctx.createOscillator()
    scream.type = 'sawtooth'
    scream.frequency.value = 320
    const sg = ctx.createGain()
    sg.gain.value = 0.0001
    const sf = ctx.createBiquadFilter()
    sf.type = 'bandpass'
    sf.frequency.value = 1100
    sf.Q.value = 5
    scream.connect(sf)
    sf.connect(sg)
    sg.connect(this.master)
    sg.gain.exponentialRampToValueAtTime(0.09, t + 0.04)
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    scream.frequency.linearRampToValueAtTime(480, t + 0.2)
    scream.start(t + 0.02)
    scream.stop(t + 0.38)
  }

  /** Jump-scare stinger — sudden dissonance then cut. */
  playStinger() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    // Sudden silence gap before spike
    this.master.gain.cancelScheduledValues(t)
    const prev = this.master.gain.value
    this.master.gain.setValueAtTime(Math.max(0.01, prev * 0.15), t)
    this.master.gain.linearRampToValueAtTime(Math.max(prev, 0.2), t + 0.08)
    for (const [freq, det] of [[180, 1], [190, 1.08], [540, 0.9]] as const) {
      const o = this.ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq * det
      const g = this.ctx.createGain()
      g.gain.value = 0.0001
      o.connect(g)
      g.connect(this.master)
      g.gain.exponentialRampToValueAtTime(0.11, t + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)
      o.start(t)
      o.stop(t + 0.5)
    }
  }

  /** Proximity duck then spike as the figure closes. */
  setProximityTension(prox: number, agg: number) {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    // Duck in mid approach, spike near melee
    let target = 0.12 + agg * 0.1
    if (prox > 0.45 && prox < 0.75) target *= 0.45 // sudden hush
    if (prox >= 0.75) target = 0.22 + prox * 0.2 + agg * 0.15
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.linearRampToValueAtTime(target, t + 0.25)
  }

  /** Capture shutter click. */
  playCaptureShutter() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = 2400
    const g = this.ctx.createGain()
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(this.master)
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.005)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04)
    o.start(t)
    o.stop(t + 0.05)
    const o2 = this.ctx.createOscillator()
    o2.type = 'triangle'
    o2.frequency.value = 900
    const g2 = this.ctx.createGain()
    g2.gain.value = 0.0001
    o2.connect(g2)
    g2.connect(this.master)
    g2.gain.exponentialRampToValueAtTime(0.08, t + 0.05)
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    o2.start(t + 0.03)
    o2.stop(t + 0.14)
  }

  /** Post-capture calm relief — soft exhale bed. */
  playRelief() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.linearRampToValueAtTime(0.06, t + 0.3)
    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 110
    const g = this.ctx.createGain()
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(this.master)
    g.gain.exponentialRampToValueAtTime(0.04, t + 0.4)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8)
    o.frequency.linearRampToValueAtTime(66, t + 1.6)
    o.start(t)
    o.stop(t + 1.9)
  }

  /** Death: drone cuts, short flatline tone. */
  playFlatline() {
    if (!this.ctx || !this.master) return
    this.setHeartbeat(0, false)
    this.aggression = 0
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.linearRampToValueAtTime(0.08, t + 0.15)

    if (this.drone) {
      this.drone.frequency.setTargetAtTime(30, t, 0.3)
    }

    const o = this.ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = 440
    const g = this.ctx.createGain()
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(this.master)
    g.gain.linearRampToValueAtTime(0.06, t + 0.05)
    g.gain.setValueAtTime(0.06, t + 1.8)
    g.gain.linearRampToValueAtTime(0.0001, t + 2.6)
    o.start(t)
    o.stop(t + 2.7)

    window.setTimeout(() => {
      if (!this.ctx || !this.master) return
      this.master.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 0.5)
    }, 2600)
  }

  private scheduleClicks() {
    const tick = () => {
      if (!this.ctx || !this.master) return
      if (Math.random() < 0.4 + this.aggression * 0.45) this.wetClick()
      else if (Math.random() < 0.08 + this.aggression * 0.1) this.suddenSilence()
      const wait = 800 + Math.random() * 2200 - this.aggression * 500
      this.clickTimer = window.setTimeout(tick, Math.max(280, wait))
    }
    this.clickTimer = window.setTimeout(tick, 1200)
  }


  private suddenSilence() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const prev = this.master.gain.value
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(0.008, t)
    this.master.gain.linearRampToValueAtTime(Math.max(prev, 0.14), t + 0.9)
  }

  private wetClick() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'square'
    o.frequency.value = 120 + Math.random() * 80
    const g = this.ctx.createGain()
    g.gain.value = 0.0001
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 800 + Math.random() * 1200
    f.Q.value = 4
    o.connect(f)
    f.connect(g)
    g.connect(this.master)
    g.gain.exponentialRampToValueAtTime(0.06 + this.aggression * 0.04, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08 + Math.random() * 0.05)
    o.start(t)
    o.stop(t + 0.12)
  }

  private scheduleVoices() {
    const tick = () => {
      if (!this.ctx || !this.master) return
      if (Math.random() < 0.2 + this.aggression * 0.35) this.wrongVoice()
      this.voiceTimer = window.setTimeout(tick, 4000 + Math.random() * 7000)
    }
    this.voiceTimer = window.setTimeout(tick, 5000)
  }

  private wrongVoice() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    o.type = 'sawtooth'
    o.frequency.value = 110 + Math.random() * 40
    const g = this.ctx.createGain()
    g.gain.value = 0.0001
    const f = this.ctx.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 400 + Math.random() * 200
    f.Q.value = 8
    o.connect(f)
    f.connect(g)
    g.connect(this.master)
    const dur = 0.8 + Math.random() * 1.2
    g.gain.exponentialRampToValueAtTime(0.025 + this.aggression * 0.02, t + 0.3)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.frequency.linearRampToValueAtTime(
      o.frequency.value * (0.85 + Math.random() * 0.3),
      t + dur,
    )
    o.start(t)
    o.stop(t + dur + 0.05)
  }


  /** Disembodied voice hint — filtered formant-ish whisper bed (no TTS words). */
  playWhisperHint() {
    if (!this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const ctx = this.ctx

    // Soft noise breath
    const noise = ctx.createBufferSource()
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2.2, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.55))
    }
    noise.buffer = buf
    const ng = ctx.createGain()
    ng.gain.value = 0.0001
    const nf = ctx.createBiquadFilter()
    nf.type = 'bandpass'
    nf.frequency.value = 900
    nf.Q.value = 0.8
    noise.connect(nf)
    nf.connect(ng)
    ng.connect(this.master)
    ng.gain.exponentialRampToValueAtTime(0.045, t + 0.25)
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 2.0)
    noise.start(t)
    noise.stop(t + 2.1)

    // Two detuned formants = wrong vowels
    for (const [freq, vol, dur] of [
      [180, 0.035, 1.6],
      [290, 0.028, 1.4],
      [420, 0.02, 1.8],
    ] as const) {
      const o = ctx.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = freq
      const g = ctx.createGain()
      g.gain.value = 0.0001
      const f = ctx.createBiquadFilter()
      f.type = 'bandpass'
      f.frequency.value = freq * 1.4
      f.Q.value = 6
      o.connect(f)
      f.connect(g)
      g.connect(this.master)
      g.gain.exponentialRampToValueAtTime(vol, t + 0.2)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.frequency.linearRampToValueAtTime(freq * (0.92 + Math.random() * 0.12), t + dur)
      o.start(t)
      o.stop(t + dur + 0.05)
    }
  }

  /**
   * Endgame climax bed: soil/crack, wet grip, reverse choir wash, then hollow silence.
   * Call once when the finale begins; phases are timed internally (~15s).
   */
  playDemonFinale() {
    if (!this.ctx || !this.master) return
    void this.ensure().then(() => {
      if (!this.ctx || !this.master) return
      const ctx = this.ctx
      const master = this.master
      const t0 = ctx.currentTime

      this.setHeartbeat(0, false)
      this.aggression = 0.15
      master.gain.cancelScheduledValues(t0)
      master.gain.linearRampToValueAtTime(0.16, t0 + 0.3)

      // Soil / crack rumble
      const rumble = ctx.createOscillator()
      rumble.type = 'sine'
      rumble.frequency.value = 28
      const rg = ctx.createGain()
      rg.gain.value = 0.0001
      rumble.connect(rg)
      rg.connect(master)
      rg.gain.exponentialRampToValueAtTime(0.1, t0 + 0.4)
      rg.gain.exponentialRampToValueAtTime(0.04, t0 + 2.5)
      rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.5)
      rumble.frequency.linearRampToValueAtTime(22, t0 + 4)
      rumble.start(t0)
      rumble.stop(t0 + 4.6)

      // Crack noise burst
      const crackAt = t0 + 1.5
      const noise = ctx.createBufferSource()
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.9, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25))
      }
      noise.buffer = buf
      const ng = ctx.createGain()
      ng.gain.value = 0.0001
      const nf = ctx.createBiquadFilter()
      nf.type = 'bandpass'
      nf.frequency.value = 180
      nf.Q.value = 0.7
      noise.connect(nf)
      nf.connect(ng)
      ng.connect(master)
      ng.gain.exponentialRampToValueAtTime(0.14, crackAt + 0.05)
      ng.gain.exponentialRampToValueAtTime(0.0001, crackAt + 0.85)
      noise.start(crackAt)
      noise.stop(crackAt + 0.9)

      // Wet grip — sticky clicks as hands seize the photo
      for (let i = 0; i < 6; i++) {
        const at = t0 + 3.2 + i * 0.28
        const o = ctx.createOscillator()
        o.type = 'square'
        o.frequency.value = 90 + Math.random() * 60
        const g = ctx.createGain()
        g.gain.value = 0.0001
        const f = ctx.createBiquadFilter()
        f.type = 'bandpass'
        f.frequency.value = 600 + Math.random() * 400
        f.Q.value = 5
        o.connect(f)
        f.connect(g)
        g.connect(master)
        g.gain.exponentialRampToValueAtTime(0.07, at + 0.01)
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.09)
        o.start(at)
        o.stop(at + 0.1)
      }

      // Reverse choir wash (detuned formants sweeping down)
      const choirAt = t0 + 5.5
      for (const [freq, vol] of [
        [220, 0.04],
        [330, 0.032],
        [440, 0.025],
        [165, 0.035],
      ] as const) {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = freq * 1.35
        const g = ctx.createGain()
        g.gain.value = 0.0001
        const f = ctx.createBiquadFilter()
        f.type = 'bandpass'
        f.frequency.value = freq
        f.Q.value = 7
        o.connect(f)
        f.connect(g)
        g.connect(master)
        g.gain.exponentialRampToValueAtTime(vol, choirAt + 0.4)
        g.gain.exponentialRampToValueAtTime(0.0001, choirAt + 3.2)
        o.frequency.exponentialRampToValueAtTime(freq * 0.55, choirAt + 3.0)
        o.start(choirAt)
        o.stop(choirAt + 3.3)
      }

      // Hollow silence bed — near-nothing after the pull
      const silenceAt = t0 + 9.0
      master.gain.linearRampToValueAtTime(0.035, silenceAt)
      master.gain.linearRampToValueAtTime(0.02, silenceAt + 4)

      if (this.drone) {
        this.drone.frequency.setTargetAtTime(32, silenceAt, 1.2)
      }
    })
  }

  stop() {
    if (this.clickTimer) clearTimeout(this.clickTimer)
    if (this.voiceTimer) clearTimeout(this.voiceTimer)
    if (this.heartTimer) clearTimeout(this.heartTimer)
    void this.ctx?.close()
    this.ctx = null
    this.started = false
  }
}
