"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Shield, Zap, Eye } from "lucide-react"

interface WalletConnectionProps {
  onConnect: () => void
}

export function WalletConnection({ onConnect }: WalletConnectionProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-fit">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription className="text-lg">
            Start monitoring your wallet for suspicious activity and protect your assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold">Real-time Monitoring</h3>
                <p className="text-sm text-muted-foreground">Watch every transaction in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold">Instant Alerts</h3>
                <p className="text-sm text-muted-foreground">Get notified of suspicious activity immediately</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold">Advanced Security</h3>
                <p className="text-sm text-muted-foreground">AI-powered threat detection</p>
              </div>
            </div>
          </div>

          <Button onClick={onConnect} size="lg" className="w-full sm:w-auto">
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
