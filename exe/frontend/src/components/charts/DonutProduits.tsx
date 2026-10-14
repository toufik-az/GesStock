import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Datum { nom: string; total: number }
interface Props  { data: Datum[] }

const COLORS = ['#2563EB','#E65100','#00695C','#F9A825','#AD1457']

export function DonutProduits({ data }: Props) {
  if (!data.length) return (
    <div className="flex h-48 items-center justify-center text-sm text-muted">
      Aucune donnée
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="nom"
          cx="50%"
          cy="50%"
          innerRadius="42%"
          outerRadius="68%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) =>
            new Intl.NumberFormat('fr-DZ').format(v) + ' DA'
          }
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11 }}
          formatter={(value: string) =>
            value.length > 18 ? value.slice(0, 17) + '…' : value
          }
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
