"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"

export default function InitPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/init", {
        method: "GET",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize database")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Initialize Database</CardTitle>
          <CardDescription>
            Set up the database with employee data. This should be done once after setting up your environment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result && !error && (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                This will create 6 employees in the database:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>• 3 Coders (Aditya, Vipin, Vikash)</li>
                <li>• 3 Peepers (Rohit, Pawan, Annu)</li>
              </ul>
              <Button
                onClick={handleInit}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Database"
                )}
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">{result.message}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Successfully initialized {result.employees} employees.
              </p>
              {result.employees_data && (
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-xs font-semibold mb-2">Employees added:</p>
                  <ul className="text-xs space-y-1">
                    {result.employees_data.map((emp: any) => (
                      <li key={emp.id}>
                        {emp.name} ({emp.role})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                onClick={() => {
                  setResult(null)
                  setError(null)
                }}
                variant="outline"
                className="w-full mt-4"
              >
                Initialize Again
              </Button>
            </div>
          )}

          {error && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Make sure:
                <br />• DATABASE_URL is set in your .env.local file
                <br />• MongoDB is running and accessible
                <br />• Database connection is correct
              </p>
              <Button
                onClick={() => {
                  setResult(null)
                  setError(null)
                }}
                variant="outline"
                className="w-full mt-4"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

