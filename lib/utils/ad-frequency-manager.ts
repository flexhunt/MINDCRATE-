export class AdFrequencyManager {
  private static instance: AdFrequencyManager
  private lastAdTimes: Map<string, number> = new Map()
  private readonly DEFAULT_GAP_MINUTES = 5

  static getInstance(): AdFrequencyManager {
    if (!AdFrequencyManager.instance) {
      AdFrequencyManager.instance = new AdFrequencyManager()
    }
    return AdFrequencyManager.instance
  }

  canShowAd(adType: string, gapMinutes: number = this.DEFAULT_GAP_MINUTES): boolean {
    try {
      const now = Date.now()
      const lastTime = this.getLastAdTime(adType)
      const gapMs = gapMinutes * 60 * 1000

      if (!lastTime || now - lastTime >= gapMs) {
        this.setLastAdTime(adType, now)
        return true
      }

      const remainingTime = Math.ceil((gapMs - (now - lastTime)) / 60000)
      console.log(`Ad blocked for ${adType} - wait ${remainingTime} more minutes`)
      return false
    } catch (error) {
      console.log("Ad frequency check failed:", error)
      return false
    }
  }

  private getLastAdTime(adType: string): number | null {
    try {
      // Try localStorage first
      const stored = localStorage.getItem(`lastAd_${adType}`)
      if (stored) {
        return Number.parseInt(stored)
      }

      // Fallback to memory
      return this.lastAdTimes.get(adType) || null
    } catch (error) {
      return this.lastAdTimes.get(adType) || null
    }
  }

  private setLastAdTime(adType: string, time: number): void {
    try {
      // Store in localStorage
      localStorage.setItem(`lastAd_${adType}`, time.toString())
    } catch (error) {
      // Fallback to memory
      console.log("localStorage not available, using memory storage")
    }

    // Always store in memory as backup
    this.lastAdTimes.set(adType, time)
  }

  getRemainingTime(adType: string, gapMinutes: number = this.DEFAULT_GAP_MINUTES): number {
    const lastTime = this.getLastAdTime(adType)
    if (!lastTime) return 0

    const now = Date.now()
    const gapMs = gapMinutes * 60 * 1000
    const elapsed = now - lastTime

    return Math.max(0, Math.ceil((gapMs - elapsed) / 60000))
  }
}
