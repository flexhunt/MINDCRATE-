"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client-browser"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast/use-toast"
import { Loader2, Play, Coins, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AdCard {
  id: string
  name: string
  description: string
  waiting_time: number
  direct_link: string
  coins_reward: number
  active: boolean
  created_at: string
}

interface AdUsage {
  ad_card_id: string
  used_at: string
}

export default function EarnCoinsClient() {
  const [adCards, setAdCards] = useState<AdCard[]>([])
  const [loading, setLoading] = useState(true)
  const [watchingAd, setWatchingAd] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const [userCoins, setUserCoins] = useState<number>(0)
  const [usedCards, setUsedCards] = useState<AdUsage[]>([])
  const [cooldowns, setCooldowns] = useState<Record<string, string>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchData()

    // Update cooldowns every minute
    const interval = setInterval(updateCooldowns, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    updateCooldowns()
  }, [usedCards])

  const fetchData = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Please Login",
          description: "You need to be logged in to earn coins.",
          variant: "destructive",
        })
        return
      }

      // Fetch ad cards
      const { data: cardsData, error: cardsError } = await supabase
        .from("ad_cards")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })

      if (cardsError) throw cardsError
      setAdCards(cardsData || [])

      // Fetch user's coin balance
      const { data: coinData } = await supabase
        .from("user_coins")
        .select("balance")
        .eq("user_id", session.user.id)
        .single()

      setUserCoins(coinData?.balance || 0)

      // Fetch user's ad usage from last 24 hours
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 24)

      const { data: usageData, error: usageError } = await supabase
        .from("ad_card_usage")
        .select("ad_card_id, used_at")
        .eq("user_id", session.user.id)
        .gte("used_at", yesterday.toISOString())

      if (usageError) {
        console.error("Error fetching usage data:", usageError)
      } else {
        setUsedCards(usageData || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCooldowns = () => {
    const now = new Date()
    const newCooldowns: Record<string, string> = {}

    usedCards.forEach((usage) => {
      const usedTime = new Date(usage.used_at)
      const nextAvailable = new Date(usedTime)
      nextAvailable.setHours(nextAvailable.getHours() + 24)

      if (nextAvailable > now) {
        const timeRemaining = nextAvailable.getTime() - now.getTime()
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))
        newCooldowns[usage.ad_card_id] = `${hoursRemaining}h ${minutesRemaining}m`
      }
    })

    setCooldowns(newCooldowns)
  }

  const watchAd = async (adCard: AdCard) => {
    // Check if card was already used in last 24 hours
    if (isCardOnCooldown(adCard.id)) {
      toast({
        title: "Already Used",
        description: `You can use this ad again in ${cooldowns[adCard.id]}`,
        variant: "destructive",
      })
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      toast({
        title: "Please Login",
        description: "You need to be logged in to earn coins.",
        variant: "destructive",
      })
      return
    }

    setWatchingAd(adCard.id)
    setCountdown(adCard.waiting_time)

    // Record ad usage in database
    const now = new Date().toISOString()
    const { error: usageError } = await supabase.from("ad_card_usage").insert({
      user_id: session.user.id,
      ad_card_id: adCard.id,
      used_at: now,
    })

    if (usageError) {
      console.error("Error recording ad usage:", usageError)
      setWatchingAd(null)
      toast({
        title: "Error",
        description: "Failed to record ad usage. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Update local state
    setUsedCards((prev) => [...prev, { ad_card_id: adCard.id, used_at: now }])

    // Open the ad link in a new tab
    window.open(adCard.direct_link, "_blank")

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          setWatchingAd(null)
          awardCoins(adCard.coins_reward, session.user.id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const awardCoins = async (coins: number, userId: string) => {
    try {
      // Update user coins
      const { data: currentCoins } = await supabase
        .from("user_coins")
        .select("balance, lifetime_earned")
        .eq("user_id", userId)
        .single()

      const newBalance = (currentCoins?.balance || 0) + coins
      const newLifetimeEarned = (currentCoins?.lifetime_earned || 0) + coins

      const { error: updateError } = await supabase.from("user_coins").upsert({
        user_id: userId,
        balance: newBalance,
        lifetime_earned: newLifetimeEarned,
        updated_at: new Date().toISOString(),
      })

      if (updateError) {
        console.error("Error updating coins:", updateError)
        toast({
          title: "Error",
          description: "Failed to award coins. Please contact support.",
          variant: "destructive",
        })
        return
      }

      // Record transaction
      await supabase.from("coin_transactions").insert({
        user_id: userId,
        amount: coins,
        balance_after: newBalance,
        transaction_type: "ad_watch",
        description: "Watched advertisement",
      })

      setUserCoins(newBalance)

      toast({
        title: "Coins Earned!",
        description: `You earned ${coins} coins for watching the ad!`,
      })
    } catch (error) {
      console.error("Error awarding coins:", error)
      toast({
        title: "Error",
        description: "Failed to award coins. Please contact support.",
        variant: "destructive",
      })
    }
  }

  const isCardOnCooldown = (cardId: string) => {
    return usedCards.some((usage) => usage.ad_card_id === cardId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Coin Balance */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Coins className="h-8 w-8 text-yellow-500" />
          <span className="text-3xl font-bold">{userCoins}</span>
          <span className="text-lg text-muted-foreground">Coins</span>
        </div>
      </div>

      {/* Important Notice */}
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <strong>Important:</strong> Please disable ad blockers and VPNs for the best experience. We need your support
          to keep Mindcrate running! Each ad can only be watched once per day per account.
        </AlertDescription>
      </Alert>

      {/* Ad Cards */}
      {adCards.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Watch Ads to Earn Coins</h2>
          <p className="text-center text-muted-foreground">Each ad can only be watched once per day per account</p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adCards.map((adCard) => {
              const onCooldown = isCardOnCooldown(adCard.id)
              const timeRemaining = cooldowns[adCard.id]

              return (
                <Card key={adCard.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{adCard.name}</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        +{adCard.coins_reward} coins
                      </Badge>
                    </CardTitle>
                    <CardDescription>{adCard.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-green-600">{adCard.coins_reward} Coins</div>
                      <p className="text-sm text-muted-foreground">Wait {adCard.waiting_time} seconds after clicking</p>

                      {onCooldown && timeRemaining && (
                        <div className="flex items-center justify-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                          <Clock className="h-4 w-4" />
                          <span>Available in {timeRemaining}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => watchAd(adCard)}
                      disabled={watchingAd === adCard.id || onCooldown}
                    >
                      {watchingAd === adCard.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Wait {countdown}s...
                        </>
                      ) : onCooldown ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          Used Today
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Watch Ad for {adCard.coins_reward} Coins
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium">No ads available</h3>
          <p className="text-muted-foreground mt-2">Check back later for new earning opportunities.</p>
        </div>
      )}
    </div>
  )
}
