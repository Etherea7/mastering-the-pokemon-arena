import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2 } from "lucide-react"

interface StatsTableProps {
  loading: boolean
  statsData: Array<{
    pokemon: string
    usage: number | null
    winRate: number | null
  }>
}

export function StatsTable({ loading, statsData }: StatsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stats Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats Table</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pokemon</TableHead>
              <TableHead>Usage Count</TableHead>
              <TableHead>Viability</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statsData.map((row, index) => (
              <TableRow key={row.pokemon} className={index % 2 === 0 ? 'bg-muted' : ''}>
                <TableCell>{row.pokemon}</TableCell>
                <TableCell>{row.usage?.toLocaleString() ?? 'N/A'}</TableCell>
                <TableCell>{row.winRate ?? 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
