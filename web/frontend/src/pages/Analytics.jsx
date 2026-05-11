import { useEffect, useMemo, useState } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import dayjs from 'dayjs'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { BarChart } from '@mui/x-charts/BarChart'

import { DataGrid } from '@mui/x-data-grid'

const CATEGORY_COLORS = {
  'Good': '#0A9A40',
  'Moderate': '#F59E0B',
  'Unhealthy (SG)': '#F97316',
  'Unhealthy': '#DC2626',
  'Very Unhealthy': '#7C3AED',
  'Hazardous': '#7F1D1D',
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const Analytics = () => {
  const { user } = useAuthContext()
  const isAdmin = user && user.role === 'admin'

  const [from, setFrom] = useState(dayjs().subtract(24, 'hour'))
  const [to, setTo] = useState(dayjs())
  const [deviceId, setDeviceId] = useState('all')
  const [metric, setMetric] = useState('aqi')

  const [devices, setDevices] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Live mode: auto-refresh every 30 seconds. Turns off when the user manually
  // edits the date range so we don't keep overwriting their selection.
  const [liveMode, setLiveMode] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Fetch devices for the filter dropdown
  useEffect(() => {
    if (!isAdmin) return
    const fetchDevices = async () => {
      const res = await fetch('/api/device', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      if (res.ok) setDevices(await res.json())
    }
    fetchDevices()
  }, [user, isAdmin])

  // Fetch analytics on filter change + poll every 30s while live mode is on.
  useEffect(() => {
    if (!isAdmin) return

    const fetchAnalytics = async (isInitial = false) => {
      if (isInitial) setLoading(true)
      setError('')

      // In live mode, always query up to "now" so new data shows up.
      const effectiveTo = liveMode ? dayjs() : to

      const params = new URLSearchParams({
        from: from.toISOString(),
        to: effectiveTo.toISOString(),
      })
      if (deviceId !== 'all') params.append('deviceId', deviceId)

      try {
        const res = await fetch(`/api/aqi/analytics?${params}`, {
          headers: { 'Authorization': `Bearer ${user.token}` }
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load analytics')
        setData(json)
        setLastUpdated(new Date())
      } catch (err) {
        setError(err.message)
      } finally {
        if (isInitial) setLoading(false)
      }
    }

    fetchAnalytics(true)

    if (!liveMode) return
    const interval = setInterval(() => fetchAnalytics(false), 30000)
    return () => clearInterval(interval)
  }, [user, isAdmin, from, to, deviceId, liveMode])

  // Pie chart data
  const pieData = useMemo(() => {
    if (!data) return []
    return data.categories
      .filter(c => c.count > 0)
      .map((c, i) => ({
        id: i,
        value: c.count,
        label: c.label,
        color: CATEGORY_COLORS[c.label] || '#94A3B8',
      }))
  }, [data])

  // Heatmap data: 7 days × 24 hours grid
  const heatmapGrid = useMemo(() => {
    if (!data) return []
    const grid = Array.from({ length: 7 }, () => Array(24).fill(null))
    for (const cell of data.heatmap) {
      // dow is 1=Sun..7=Sat from MongoDB; convert to 0-indexed
      const dowIdx = cell.dow - 1
      grid[dowIdx][cell.hour] = cell.avgAqi
    }
    return grid
  }, [data])

  // ============== ADMIN GATE ==============
  if (!user) {
    return <Box sx={{ p: 3 }}><Alert severity="warning">Please log in.</Alert></Box>
  }
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Analytics is admin-only. Please contact an administrator if you need access.
        </Alert>
      </Box>
    )
  }

  // ============== RENDER ==============
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Analytics
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            {lastUpdated && (
              <Stack direction="row" alignItems="center" spacing={0.7}>
                <Box
                  sx={{
                    width: 8, height: 8, borderRadius: '50%',
                    bgcolor: liveMode ? '#22C55E' : '#94A3B8',
                    boxShadow: liveMode ? '0 0 0 4px rgba(34,197,94,0.18)' : 'none',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {liveMode ? 'Live · ' : 'Paused · '}
                  Last updated {dayjs(lastUpdated).format('HH:mm:ss')}
                </Typography>
              </Stack>
            )}
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={liveMode}
                  onChange={(e) => {
                    const on = e.target.checked
                    setLiveMode(on)
                    if (on) setTo(dayjs()) // jump 'to' back to now when turning live mode on
                  }}
                />
              }
              label="Live"
            />
          </Stack>
        </Stack>

        {/* ============ FILTER BAR ============ */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <DateTimePicker
                  label="From"
                  value={from}
                  onChange={(v) => { setFrom(v); setLiveMode(false) }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DateTimePicker
                  label="To"
                  value={to}
                  onChange={(v) => { setTo(v); setLiveMode(false) }}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                  disabled={liveMode}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Device</InputLabel>
                  <Select
                    label="Device"
                    value={deviceId}
                    onChange={e => setDeviceId(e.target.value)}
                  >
                    <MenuItem value="all">All devices</MenuItem>
                    {devices.map(d => (
                      <MenuItem key={d.deviceId} value={d.deviceId}>
                        {d.name} — {d.room}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Metric (line chart)</InputLabel>
                  <Select
                    label="Metric (line chart)"
                    value={metric}
                    onChange={e => setMetric(e.target.value)}
                  >
                    <MenuItem value="aqi">AQI</MenuItem>
                    <MenuItem value="pm25">PM 2.5</MenuItem>
                    <MenuItem value="pm10">PM 10</MenuItem>
                    <MenuItem value="co2">CO₂</MenuItem>
                    <MenuItem value="tvoc">TVOC</MenuItem>
                    <MenuItem value="temp">Temperature</MenuItem>
                    <MenuItem value="humidity">Humidity</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {data && !loading && (
          <>
            {/* ============ KPI CARDS ============ */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="Average AQI"
                  value={data.kpis.avg}
                  subtitle={data.kpis.avgCategory}
                  color={CATEGORY_COLORS[data.kpis.avgCategory]}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="Highest AQI"
                  value={data.kpis.max}
                  subtitle="Peak in range"
                  color="#DC2626"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="% Good"
                  value={`${data.kpis.pctGood}%`}
                  subtitle="Of all readings"
                  color="#0A9A40"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  label="Total Readings"
                  value={data.kpis.count.toLocaleString()}
                  subtitle="In selected range"
                  color="#1E5BFF"
                />
              </Grid>
            </Grid>

            {/* ============ LINE CHART ============ */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {metricLabel(metric)} Over Time
                </Typography>
                {data.buckets.length === 0 ? (
                  <Typography color="text.secondary">No data in this range.</Typography>
                ) : (
                  <LineChart
                    height={300}
                    xAxis={[{
                      data: data.buckets.map(b => new Date(b.time)),
                      scaleType: 'time',
                    }]}
                    series={[{
                      data: data.buckets.map(b => b[metric]),
                      label: metricLabel(metric),
                      color: '#1E5BFF',
                      showMark: false,
                    }]}
                  />
                )}
              </CardContent>
            </Card>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* ============ PIE CHART ============ */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Air Quality Category Distribution
                    </Typography>
                    {pieData.length === 0 ? (
                      <Typography color="text.secondary">No data in this range.</Typography>
                    ) : (
                      <PieChart
                        height={340}
                        margin={{ top: 50, bottom: 20, left: 20, right: 20 }}
                        series={[{
                          data: pieData,
                          innerRadius: 55,
                          outerRadius: 95,
                          paddingAngle: 2,
                          cornerRadius: 4,
                          // Show only percentage inside the arc — short enough to fit.
                          arcLabel: (item) => {
                            const total = pieData.reduce((s, d) => s + d.value, 0)
                            const pct = Math.round((item.value / total) * 100)
                            return pct >= 5 ? `${pct}%` : ''
                          },
                          arcLabelMinAngle: 20,
                          arcLabelRadius: 75,
                        }]}
                        sx={{
                          '& .MuiPieArcLabel-root': {
                            fill: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                          },
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* ============ BAR CHART (by device) ============ */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Average AQI by Device
                    </Typography>
                    {data.byDevice.length === 0 ? (
                      <Typography color="text.secondary">No data in this range.</Typography>
                    ) : (
                      <BarChart
                        height={320}
                        margin={{ top: 30, bottom: 90, left: 50, right: 10 }}
                        xAxis={[{
                          scaleType: 'band',
                          data: data.byDevice.map(d => d.name || d.deviceId),
                          tickLabelStyle: {
                            angle: -25,
                            textAnchor: 'end',
                            fontSize: 12,
                          },
                        }]}
                        series={[{
                          data: data.byDevice.map(d => d.avgAqi),
                          label: 'Avg AQI',
                          color: '#1E5BFF',
                        }]}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* ============ HEATMAP ============ */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Hour × Day Pattern (last 7 days)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Average AQI by hour of day and day of week. Darker = higher AQI.
                </Typography>
                <Heatmap grid={heatmapGrid} />
              </CardContent>
            </Card>

            {/* ============ DATA GRID (recent readings) ============ */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  Recent Readings (last 100)
                </Typography>
                <Box sx={{ width: '100%' }}>
                  <DataGrid
                    rows={data.recent.map(r => ({ ...r, id: r._id }))}
                    columns={[
                      {
                        field: 'createdAt',
                        headerName: 'Time',
                        flex: 1.2,
                        valueFormatter: v => v ? dayjs(v).format('MMM D, HH:mm:ss') : '',
                      },
                      { field: 'deviceId', headerName: 'Device ID', flex: 1 },
                      { field: 'Aqi', headerName: 'AQI', flex: 0.5 },
                      {
                        field: 'category',
                        headerName: 'Category',
                        flex: 1,
                        renderCell: (params) => (
                          <Chip
                            label={params.value}
                            size="small"
                            sx={{
                              bgcolor: CATEGORY_COLORS[params.value] || '#94A3B8',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        )
                      },
                      { field: 'PM25', headerName: 'PM2.5', flex: 0.6 },
                      { field: 'PM10', headerName: 'PM10', flex: 0.6 },
                      { field: 'CO2', headerName: 'CO₂', flex: 0.6 },
                      { field: 'Temperature', headerName: 'Temp', flex: 0.6 },
                      { field: 'Humidity', headerName: 'Humidity', flex: 0.6 },
                    ]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 10 } },
                    }}
                    pageSizeOptions={[10, 25, 50]}
                    disableRowSelectionOnClick
                    autoHeight
                    density="compact"
                  />
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </LocalizationProvider>
  )
}

// ============== KPI CARD ==============
const KpiCard = ({ label, value, subtitle, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label.toUpperCase()}
      </Typography>
      <Typography variant="h3" sx={{ fontWeight: 800, color: color || '#0F172A', mt: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </CardContent>
  </Card>
)

// ============== HEATMAP (custom — MUI doesn't have a built-in one) ==============
const Heatmap = ({ grid }) => {
  // grid is [7][24] of AQI numbers or null
  const maxAqi = Math.max(...grid.flat().filter(v => v !== null), 50)
  const colorFor = (v) => {
    if (v === null) return '#F1F5F9'
    if (v <= 50) return '#86EFAC'
    if (v <= 100) return '#FCD34D'
    if (v <= 150) return '#FB923C'
    if (v <= 200) return '#F87171'
    if (v <= 300) return '#A78BFA'
    return '#7F1D1D'
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box sx={{ display: 'inline-block', minWidth: 600 }}>
        {/* Hour header */}
        <Box sx={{ display: 'flex', mb: 0.5 }}>
          <Box sx={{ width: 40 }} />
          {Array.from({ length: 24 }, (_, h) => (
            <Box
              key={h}
              sx={{
                width: 24,
                textAlign: 'center',
                fontSize: 10,
                color: 'text.secondary'
              }}
            >
              {h % 3 === 0 ? h : ''}
            </Box>
          ))}
        </Box>
        {/* Rows */}
        {grid.map((row, dowIdx) => (
          <Box key={dowIdx} sx={{ display: 'flex', mb: 0.3, alignItems: 'center' }}>
            <Box sx={{ width: 40, fontSize: 12, color: 'text.secondary' }}>
              {DOW_LABELS[dowIdx]}
            </Box>
            {row.map((v, h) => (
              <Box
                key={h}
                sx={{
                  width: 22,
                  height: 22,
                  mx: 0.1,
                  bgcolor: colorFor(v),
                  borderRadius: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: v !== null && v > 150 ? 'white' : 'black',
                }}
                title={v !== null ? `${DOW_LABELS[dowIdx]} ${h}:00 — AQI ${v}` : `${DOW_LABELS[dowIdx]} ${h}:00 — no data`}
              >
                {v !== null && v >= 100 ? v : ''}
              </Box>
            ))}
          </Box>
        ))}
        {/* Color legend */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1, fontSize: 11, color: 'text.secondary', flexWrap: 'wrap' }}>
          {[
            { label: 'Good', color: '#86EFAC' },
            { label: 'Moderate', color: '#FCD34D' },
            { label: 'Unhealthy (SG)', color: '#FB923C' },
            { label: 'Unhealthy', color: '#F87171' },
            { label: 'Very Unhealthy', color: '#A78BFA' },
            { label: 'Hazardous', color: '#7F1D1D' },
          ].map(c => (
            <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: c.color, borderRadius: 0.5 }} />
              {c.label}
            </Box>
          ))}
          <Typography variant="caption" sx={{ ml: 2 }}>
            Max in range: {maxAqi}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

const metricLabel = (m) => ({
  aqi: 'AQI',
  pm25: 'PM 2.5 (µg/m³)',
  pm10: 'PM 10 (µg/m³)',
  co2: 'CO₂ (ppm)',
  tvoc: 'TVOC (µg/m³)',
  temp: 'Temperature (°C)',
  humidity: 'Humidity (%)',
}[m] || m)

export default Analytics
