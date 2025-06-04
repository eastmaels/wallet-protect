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

interface SuspiciousActivityDetectorProps {
  transaction: Transaction
  onSuspiciousActivity: (transaction: Transaction, riskFactors: string[]) => void
}

export function SuspiciousActivityDetector({ transaction, onSuspiciousActivity }: SuspiciousActivityDetectorProps) {
  const analyzeTransaction = (tx: Transaction) => {
    const riskFactors: string[] = []
    let riskLevel: "low" | "medium" | "high" = "low"

    // High value transaction
    if (Number.parseFloat(tx.value) > 1.0) {
      riskFactors.push("High value transaction")
      riskLevel = "medium"
    }

    // Unusual gas price
    if (Number.parseFloat(tx.gasPrice) > 100) {
      riskFactors.push("Unusually high gas price")
      riskLevel = "medium"
    }

    // Failed transaction
    if (tx.status === "failed") {
      riskFactors.push("Transaction failed")
      riskLevel = "medium"
    }

    // Unknown recipient (simplified check)
    if (!isKnownAddress(tx.to)) {
      riskFactors.push("Unknown recipient address")
      if (riskLevel === "low") riskLevel = "medium"
    }

    // Contract interaction detection
    if (isContractAddress(tx.to)) {
      riskFactors.push("Contract interaction")
      if (!isVerifiedContract(tx.to)) {
        riskFactors.push("Unverified contract")
        riskLevel = "high"
      }
    }

    // Time-based analysis (transactions at unusual hours)
    const hour = new Date(tx.timestamp).getHours()
    if (hour < 6 || hour > 22) {
      riskFactors.push("Transaction at unusual hours")
    }

    if (riskFactors.length > 2) {
      riskLevel = "high"
    }

    if (riskLevel === "high" || riskLevel === "medium") {
      onSuspiciousActivity({ ...tx, riskLevel, riskFactors }, riskFactors)
    }
  }

  // Helper functions (simplified for demo)
  const isKnownAddress = (address: string): boolean => {
    const knownAddresses = ["0xa0b86a33e6c3b4c6c3b4c6c3b4c6c3b4c6c3b4c6", "0xb0b86a33e6c3b4c6c3b4c6c3b4c6c3b4c6c3b4c6"]
    return knownAddresses.includes(address.toLowerCase())
  }

  const isContractAddress = (address: string): boolean => {
    // Simplified contract detection
    return address.length === 42 && address.startsWith("0x")
  }

  const isVerifiedContract = (address: string): boolean => {
    // Simplified verification check
    const verifiedContracts = ["0xc0b86a33e6c3b4c6c3b4c6c3b4c6c3b4c6c3b4c6"]
    return verifiedContracts.includes(address.toLowerCase())
  }

  return null // This is a utility component that doesn't render
}
