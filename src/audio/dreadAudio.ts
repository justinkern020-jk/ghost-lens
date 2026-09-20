/** Subtle dread bed — low drone, wet clicks, distant wrong voices. No cartoon boos. */

export class DreadAudio {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private drone: OscillatorNode | null = null
  private started = false
  private clickTimer: number | null = null
  private voiceTimer: number | null = null
  private aggression = 0

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

    this.master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2)
    this.scheduleClicks()
    this.scheduleVoices()
  }

  setPresence(active: boolean, aggression = 0) {
    this.aggression = aggression
    if (!this.ctx || !this.master) return
    const target = active ? 0.1 + aggression * 0.18 : 0.035
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

  private scheduleClicks() {
    const tick = () => {
      if (!this.ctx || !this.master) return
      if (Math.random() < 0.35 + this.aggression * 0.4) this.wetClick()
      const wait = 800 + Math.random() * 2200 - this.aggression * 500
      this.clickTimer = window.setTimeout(tick, Math.max(280, wait))
    }
    this.clickTimer = window.setTimeout(tick, 1200)
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

  stop() {
    if (this.clickTimer) clearTimeout(this.clickTimer)
    if (this.voiceTimer) clearTimeout(this.voiceTimer)
    void this.ctx?.close()
    this.ctx = null
    this.started = false
  }
}
