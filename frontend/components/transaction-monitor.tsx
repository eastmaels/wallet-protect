import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

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

interface TransactionMonitorProps {
  transactions: Transaction[]
}

export function TransactionMonitor({ transactions }: TransactionMonitorProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions to display. Start using your wallet to see activity here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <Card key={tx.hash} className="p-4">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(tx.status)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm">{formatAddress(tx.hash)}</span>
                    <Badge variant={getRiskColor(tx.riskLevel) as any}>{tx.riskLevel} risk</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    From {formatAddress(tx.from)} → {formatAddress(tx.to)}
                  </div>
                  {tx.riskFactors.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">{tx.riskFactors.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{tx.value} ETH</div>
                <div className="text-sm text-muted-foreground">{formatTime(tx.timestamp)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
