"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, Eye, Zap, Check } from "lucide-react"

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  gasPrice: string
  gasUsed: string
  status: "success" | "failed" | "pending"
  riskLevel: "low" | "medium" | "high"
  riskFactors: string[]
}

interface Alert {
  id: string
  type: "suspicious" | "high-value" | "unknown-contract" | "phishing"
  message: string
  transaction: Transaction
  timestamp: number
  acknowledged: boolean
}

interface AlertSystemProps {
  alerts: Alert[]
  onAcknowledge: (alertId: string) => void
}

export function AlertSystem({ alerts, onAcknowledge }: AlertSystemProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "suspicious":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "high-value":
        return <Zap className="h-5 w-5 text-yellow-600" />
      case "unknown-contract":
        return <Eye className="h-5 w-5 text-orange-600" />
      case "phishing":
        return <Shield className="h-5 w-5 text-purple-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "suspicious":
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      case "high-value":
        return "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      case "unknown-contract":
        return "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950"
      case "phishing":
        return "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950"
      default:
        return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Security Alerts
          </CardTitle>
          <CardDescription>No security alerts at this time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p>Your wallet is secure. No suspicious activity detected.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Security Alerts ({alerts.filter((a) => !a.acknowledged).length} active)
          </CardTitle>
          <CardDescription>Review and acknowledge security alerts</CardDescription>
        </CardHeader>
      </Card>

      {alerts.map((alert) => (
        <Card key={alert.id} className={`${getAlertColor(alert.type)} ${alert.acknowledged ? "opacity-60" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                {getAlertIcon(alert.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize">
                      {alert.type.replace("-", " ")}
                    </Badge>
                    {alert.acknowledged && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium mb-2">{alert.message}</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Transaction: {formatAddress(alert.transaction.hash)}</p>
                    <p>Value: {alert.transaction.value} ETH</p>
                    <p>Time: {formatTime(alert.timestamp)}</p>
                    {alert.transaction.riskFactors.length > 0 && (
                      <p>Risk Factors: {alert.transaction.riskFactors.join(", ")}</p>
                    )}
                  </div>
                </div>
              </div>
              {!alert.acknowledged && (
                <Button onClick={() => onAcknowledge(alert.id)} variant="outline" size="sm">
                  Acknowledge
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
