"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert as UIAlert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Wallet, Shield, AlertTriangle, Bell, Activity } from "lucide-react"
import { TransactionMonitor } from "@/components/transaction-monitor"
import { AlertSystem } from "@/components/alert-system"
import { ethers } from "ethers"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useChainId } from 'wagmi';

// Add type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

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

interface SecurityAlert {
  id: string
  type: "suspicious" | "high-value" | "unknown-contract" | "phishing"
  message: string
  transaction: Transaction
  timestamp: number
  acknowledged: boolean
}

export default function WalletMonitorDApp() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balanceData } = useBalance({
    address,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [settings, setSettings] = useState({
    enableAlerts: true,
    highValueThreshold: "1.0",
    monitorUnknownContracts: true,
    enablePhishingDetection: true,
    alertSound: true,
  })
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    if (isConnected && address) {
      // Simulate real-time transaction monitoring
      const interval = setInterval(() => {
        const mockTransaction: Transaction = {
          hash: `0x${Math.random().toString(16).substr(2, 64)}`,
          from: address,
          to: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: (Math.random() * 5).toFixed(4),
          timestamp: Date.now(),
          gasPrice: (Math.random() * 50 + 10).toFixed(0),
          gasUsed: (Math.random() * 21000 + 21000).toFixed(0),
          status: Math.random() > 0.1 ? "success" : "failed",
          riskLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
          riskFactors: [],
        }

        // Add risk factors based on risk level
        if (mockTransaction.riskLevel === "high") {
          mockTransaction.riskFactors = [
            "Unknown contract interaction",
            "High gas price",
            "Unusual transaction pattern",
          ]
        } else if (mockTransaction.riskLevel === "medium") {
          mockTransaction.riskFactors = ["New recipient address", "Above average value"]
        }

        setTransactions((prev) => [mockTransaction, ...prev.slice(0, 49)])

        // Generate alerts for suspicious transactions
        if (mockTransaction.riskLevel === "high" && settings.enableAlerts) {
          const newAlert: SecurityAlert = {
            id: `alert-${Date.now()}`,
            type: "suspicious",
            message: `Suspicious transaction detected: ${mockTransaction.riskFactors.join(", ")}`,
            transaction: mockTransaction,
            timestamp: Date.now(),
            acknowledged: false,
          }
          setAlerts((prev) => [newAlert, ...prev])
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isConnected, address, settings.enableAlerts])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged)

  const subscribeToProtection = async () => {
    if (!address) return;
    
    setIsLoading(true);
    try {
      // Create message for signature
      const message = `Verify wallet ownership for Nodit Protection Service\nWallet: ${address}`;
      
      // Request signature from user
      const provider = new ethers.providers.Web3Provider(window.ethereum as ethers.providers.ExternalProvider);
      const signer = provider.getSigner();
      const signature = await signer.signMessage(message);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/api/wallets/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature,
          message,
          chains: [chainId] // Use chainId instead of chain name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe to protection service');
      }

      const data = await response.json();
      setIsSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe:', error);
      // You might want to show an error notification here
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Wallet Guardian</h1>
              <p className="text-slate-600 dark:text-slate-400">Advanced Web3 Security Monitoring</p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3">
              <Badge variant={isMonitoring ? "default" : "secondary"} className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {isMonitoring ? "Monitoring" : "Paused"}
              </Badge>
              <ConnectButton />
            </div>
          ) : (
            <ConnectButton />
          )}
        </div>

        {/* Alerts Banner */}
        {unacknowledgedAlerts.length > 0 && (
          <UIAlert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {unacknowledgedAlerts.length} unacknowledged security alert{unacknowledgedAlerts.length > 1 ? "s" : ""}{" "}
              detected!
            </AlertDescription>
          </UIAlert>
        )}

        {!isConnected ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <ConnectButton />
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="alerts" className="relative">
                Alerts
                {unacknowledgedAlerts.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">{unacknowledgedAlerts.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Wallet Overview */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{balanceData?.formatted} {balanceData?.symbol}</div>
                    <p className="text-xs text-muted-foreground">Chain ID: {chainId}</p>
                    {isConnected && !isSubscribed && (
                      <Button 
                        onClick={subscribeToProtection} 
                        className="mt-4 w-full"
                        variant="default"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Verifying...' : 'Subscribe to Protection Service'}
                      </Button>
                    )}
                    {isSubscribed && (
                      <Badge className="mt-4" variant="default">
                        Protection Active
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                {/* Security Status */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Security Status</CardTitle>
                    <Shield className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">Protected</div>
                    <p className="text-xs text-muted-foreground">Real-time monitoring active</p>
                  </CardContent>
                </Card>

                {/* Recent Alerts */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                    <Bell className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{unacknowledgedAlerts.length}</div>
                    <p className="text-xs text-muted-foreground">Require attention</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Transactions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>Latest wallet activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionMonitor transactions={transactions.slice(0, 5)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>Complete transaction monitoring</CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionMonitor transactions={transactions} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <AlertSystem alerts={alerts} onAcknowledge={acknowledgeAlert} />
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure monitoring and alert preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications for suspicious activity</p>
                    </div>
                    <Switch
                      checked={settings.enableAlerts}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enableAlerts: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="threshold">High Value Threshold (ETH)</Label>
                    <Input
                      id="threshold"
                      type="number"
                      step="0.1"
                      value={settings.highValueThreshold}
                      onChange={(e) => setSettings((prev) => ({ ...prev, highValueThreshold: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Monitor Unknown Contracts</Label>
                      <p className="text-sm text-muted-foreground">Alert when interacting with unverified contracts</p>
                    </div>
                    <Switch
                      checked={settings.monitorUnknownContracts}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, monitorUnknownContracts: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Phishing Detection</Label>
                      <p className="text-sm text-muted-foreground">Detect potential phishing attempts</p>
                    </div>
                    <Switch
                      checked={settings.enablePhishingDetection}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({ ...prev, enablePhishingDetection: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alert Sound</Label>
                      <p className="text-sm text-muted-foreground">Play sound for critical alerts</p>
                    </div>
                    <Switch
                      checked={settings.alertSound}
                      onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, alertSound: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
