export class PopunderFrequencyManager {
  private static readonly STORAGE_KEY = "popunder_frequency"
  private static readonly MAX_DAILY_SHOWS = 2
  private static readonly MIN_INTERVAL_HOURS = 4

  static canShowPopunder(): boolean {
    try {
      const data = this.getStoredData()
      const now = new Date()
      const today = now.toDateString()

      // Reset if it's a new day
      if (data.lastDate !== today) {
        this.resetDailyCount()
        return true
      }

      // Check if we've exceeded daily limit
      if (data.dailyCount >= this.MAX_DAILY_SHOWS) {
        return false
      }

      // Check if enough time has passed since last show
      if (data.lastShown) {
        const timeDiff = now.getTime() - new Date(data.lastShown).getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)

        if (hoursDiff < this.MIN_INTERVAL_HOURS) {
          return false
        }
      }

      return true
    } catch (error) {
      console.warn("Error checking popunder frequency:", error)
      return true // Default to allowing if there's an error
    }
  }

  static recordPopunderShow(): void {
    try {
      const data = this.getStoredData()
      const now = new Date()
      const today = now.toDateString()

      const newData = {
        lastDate: today,
        dailyCount: data.lastDate === today ? data.dailyCount + 1 : 1,
        lastShown: now.toISOString(),
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData))
    } catch (error) {
      console.warn("Error recording popunder show:", error)
    }
  }

  private static getStoredData(): {
    lastDate: string
    dailyCount: number
    lastShown: string | null
  } {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.warn("Error parsing stored popunder data:", error)
    }

    return {
      lastDate: "",
      dailyCount: 0,
      lastShown: null,
    }
  }

  private static resetDailyCount(): void {
    try {
      const newData = {
        lastDate: new Date().toDateString(),
        dailyCount: 0,
        lastShown: null,
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData))
    } catch (error) {
      console.warn("Error resetting popunder count:", error)
    }
  }
}
