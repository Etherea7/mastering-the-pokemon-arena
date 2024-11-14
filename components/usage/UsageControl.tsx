// components/pokemon-usage/UsageControls.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BATTLE_FORMATS } from "@/types/format"


interface UsageControlsProps {
  selectedTier: string
  setSelectedTier: (tier: string) => void
  selectedGeneration: string
  setSelectedGeneration: (generation: string) => void
  startMonth: string
  setStartMonth: (month: string) => void
  startYear: string
  setStartYear: (year: string) => void
  endMonth: string
  setEndMonth: (month: string) => void
  endYear: string
  setEndYear: (year: string) => void
  activePreset: number
  handlePresetClick: (top: number) => void
  selectedRating?: number;
  setSelectedRating: (rating: number | undefined) => void;
}

const years = ['2022','2023', '2024']
const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]
const tiers = BATTLE_FORMATS
const generations = Array.from({ length: 9 }, (_, i) => ({
  value: `gen${i + 1}`,
  label: `Generation ${i + 1}`
}))

const ratings = [0,1500, 1630, 1695,1760, 1825];

export function UsageControls({
  selectedTier,
  setSelectedTier,
  selectedGeneration,
  setSelectedGeneration,
  startMonth,
  setStartMonth,
  startYear,
  setStartYear,
  endMonth,
  setEndMonth,
  endYear,
  setEndYear,
  activePreset,
  handlePresetClick,
  selectedRating,
  setSelectedRating,
}: UsageControlsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Display Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block mb-2">Generation</label>
            <Select value={selectedGeneration} onValueChange={setSelectedGeneration}>
              <SelectTrigger>
                <SelectValue placeholder="Select Generation" />
              </SelectTrigger>
              <SelectContent>
                {generations.map(gen => (
                  <SelectItem key={gen.value} value={gen.value}>{gen.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block mb-2">Tier</label>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger>
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>
              <SelectContent>
                {tiers.SMOGON.map(tier => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))}
                {tiers.VGC.map(tier => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block mb-2">Start Date</label>
            <div className="flex gap-2">
              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block mb-2">End Date</label>
            <div className="flex gap-2">
              <Select value={endYear} onValueChange={setEndYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block mb-2">Rating</label>
            <Select 
              value={selectedRating?.toString() ?? ''} 
              onValueChange={(value) => setSelectedRating(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Ratings</SelectItem>
                {ratings.map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

      </CardContent>
    </Card>
  )
}