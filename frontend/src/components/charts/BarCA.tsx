import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Datum { categorie: string; total: number }
interface Props  { data: Datum[] }

const COLORS = ['#2563EB','#E65100','#00695C','#F9A825','#AD1457','#0277BD','#6A1B9A','#2E7D32']

export function BarCA({ data }: Props) {
  if (!data.length) return (
    <div className="flex h-48 items-center justify-center text-sm text-muted">
      Aucune donnée pour cette période
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
        <XAxis
          dataKey="categorie"
          tick={{ fontSize: 11, fill: '#6B7280' }}
          tickLine={false}
          axisLine={false}
          interval={0}
          angle={-30}
          textAnchor="end"
        />
        <YAxis hide />
        <Tooltip
          formatter={(v: number) =>
            new Intl.NumberFormat('fr-DZ').format(v) + ' DA'
          }
          labelStyle={{ fontSize: 12 }}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
