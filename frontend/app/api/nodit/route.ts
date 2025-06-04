import { type NextRequest, NextResponse } from "next/server"

// Mock Nodit Web3 server communication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, transactionHash, alertType, riskLevel } = body

    // Simulate API call to Nodit Web3 server
    const noditResponse = await fetch("https://api.nodit.io/v1/security/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NODIT_API_KEY}`,
      },
      body: JSON.stringify({
        wallet: walletAddress,
        transaction: transactionHash,
        alert_type: alertType,
        risk_level: riskLevel,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!noditResponse.ok) {
      throw new Error("Failed to communicate with Nodit server")
    }

    const data = await noditResponse.json()

    return NextResponse.json({
      success: true,
      message: "Alert sent to Nodit server successfully",
      data: data,
    })
  } catch (error) {
    console.error("Nodit API Error:", error)

    // Return mock success for demo purposes
    return NextResponse.json({
      success: true,
      message: "Alert processed (demo mode)",
      data: {
        alert_id: `alert_${Date.now()}`,
        status: "processed",
        risk_score: Math.random() * 100,
      },
    })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const walletAddress = searchParams.get("wallet")

  try {
    // Mock response for wallet security status
    return NextResponse.json({
      wallet: walletAddress,
      security_status: "protected",
      active_monitors: 3,
      last_scan: new Date().toISOString(),
      risk_score: 15,
      recommendations: ["Enable 2FA for additional security", "Review recent transactions", "Update security settings"],
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch wallet status" }, { status: 500 })
  }
}
