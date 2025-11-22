import React, { useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider, useQuery, useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { Menu, User, Shield, LogOut, Plus, Search, BarChart3, Settings, Database } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
const client = new QueryClient()

function useAuth() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [role, setRole] = useState(localStorage.getItem('role') || '')
  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password })
    setToken(data.access_token)
    const payload = JSON.parse(atob(data.access_token.split('.')[1]))
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', payload.role)
    setRole(payload.role)
  }
  const logout = () => { localStorage.clear(); setToken(''); setRole('') }
  return { token, role, login, logout }
}

function fetcher(url, token){
  return axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.data)
}
function poster(url, token, body){
  return axios.post(url, body, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.data)
}

function Login({ onLogin }){
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <input className="w-full border rounded px-3 py-2 bg-transparent" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2 bg-transparent" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} onClick={async()=>{ setError(''); setLoading(true); try { await onLogin(email, password) } catch(e){ setError('Invalid credentials') } finally { setLoading(false) } }} className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded px-3 py-2">Login</button>
      </div>
    </div>
  )
}

function Topbar({ onMenu, role, onLogout }){
  return (
    <div className="flex items-center justify-between border-b px-4 h-14 bg-white/60 dark:bg-gray-900/60 backdrop-blur">
      <div className="flex gap-2 items-center">
        <button onClick={onMenu} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><Menu size={20} /></button>
        <span className="font-semibold">Multi-Management Platform</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase px-2 py-1 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">{role}</span>
        <button onClick={onLogout} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded border hover:bg-gray-50 dark:hover:bg-gray-800"><LogOut size={16}/> Logout</button>
      </div>
    </div>
  )
}

function Sidebar({ open, systems, active, onSelect, role }){
  return (
    <div className={`h-[calc(100vh-56px)] border-r bg-white dark:bg-gray-900 transition-all ${open? 'w-64':'w-0 md:w-64'} overflow-auto`}>
      <div className="p-3 sticky top-0 bg-inherit border-b flex items-center gap-2"><Database size={16}/> <span className="font-medium">Systems</span></div>
      <div className="p-2">
        {systems?.map(s => (
          <button key={s} onClick={()=>onSelect(s)} className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${active===s?'bg-primary-50 dark:bg-primary-900/20 text-primary-700':''}`}>{s}</button>
        ))}
      </div>
    </div>
  )
}

function Analytics({ token, system }){
  const { data } = useQuery({ queryKey: ['analytics', system], queryFn: ()=>fetcher(`${API}/analytics/${system}`, token), enabled: !!system })
  const series = useMemo(()=>{
    const colors = ['#6366f1','#22c55e','#06b6d4','#f59e0b','#ef4444']
    const byMonth = {}
    (data?.series||[]).forEach((row)=>{
      const m = row._id.month
      const t = row._id.type
      byMonth[m] = byMonth[m] || { month: m }
      byMonth[m][t] = row.count
    })
    const arr = Object.values(byMonth).sort((a,b)=>a.month-b.month)
    return { arr, colors }
  }, [data])
  const pie = (data?.series||[]).reduce((acc, r)=>{ acc[r._id.type]=(acc[r._id.type]||0)+r.count; return acc }, {})
  const pieData = Object.entries(pie).map(([name, value])=>({ name, value }))
  const COLORS = ['#6366f1','#22c55e','#06b6d4','#f59e0b','#ef4444','#84cc16']
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
        <h3 className="font-medium mb-2 flex items-center gap-2"><BarChart3 size={16}/> Monthly by type</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={series.arr}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            {pieData.map((p, idx)=> (
              <Bar key={p.name} dataKey={p.name} fill={COLORS[idx%COLORS.length]} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
        <h3 className="font-medium mb-2">Distribution</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Table({ columns, data }){
  // lightweight simple table; tanstack table is installed for future expansion
  return (
    <div className="overflow-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map(c=> <th key={c} className="text-left px-3 py-2 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx)=> (
            <tr key={idx} className="border-t">
              {columns.map(c=> <td key={c} className="px-3 py-2">{String(row[c] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ResourceCRUD({ token, system, rtype }){
  const [query, setQuery] = useState('')
  const [form, setForm] = useState('{}')
  const { data, refetch, isFetching } = useQuery({ queryKey:['res', system, rtype, query], queryFn: ()=>poster(`${API}/systems/${system}/${rtype}/query`, token, { filter: query? JSON.parse(query): {}, limit: 50 }), enabled: !!system && !!rtype && !!token })
  const createMut = useMutation({ mutationFn: (body)=>poster(`${API}/systems/${system}/${rtype}`, token, { system, type: rtype, data: body }) , onSuccess: ()=>refetch() })
  const rows = (data||[]).map(r => ({ id: r.id, ...r.data }))
  const columns = useMemo(()=> Array.from(new Set(rows.flatMap(r=>Object.keys(r)))), [JSON.stringify(rows)])
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input className="flex-1 border rounded px-3 py-2 bg-transparent" placeholder="Filter JSON e.g. {\"data.name\": \"Alice\"}" value={query} onChange={e=>setQuery(e.target.value)} />
        <button disabled={isFetching} onClick={()=>refetch()} className="px-3 py-2 rounded bg-primary-600 text-white">Search</button>
      </div>
      <div className="flex items-center gap-2">
        <input className="flex-1 border rounded px-3 py-2 bg-transparent" placeholder='Data JSON e.g. {"name":"Alice"}' value={form} onChange={e=>setForm(e.target.value)} />
        <button onClick={()=>{ try { const obj = JSON.parse(form); createMut.mutate(obj) } catch(e){ alert('Invalid JSON') } }} className="px-3 py-2 rounded bg-green-600 text-white flex items-center gap-1"><Plus size={16}/> Create</button>
      </div>
      <Table columns={columns} data={rows} />
    </div>
  )
}

function Dashboard({ token, role }){
  const [menuOpen, setMenuOpen] = useState(true)
  const { data: systems } = useQuery({ queryKey:['systems'], queryFn: ()=>fetcher(`${API}/systems`, token), enabled: !!token })
  const [active, setActive] = useState('')
  const [rtype, setRtype] = useState('student')
  return (
    <div className="h-screen flex flex-col">
      <Topbar onMenu={()=>setMenuOpen(v=>!v)} role={role} onLogout={()=>{ localStorage.clear(); location.reload() }} />
      <div className="flex flex-1">
        <Sidebar open={menuOpen} systems={systems||[]} active={active} onSelect={setActive} role={role} />
        <div className="flex-1 p-4 space-y-4 overflow-auto">
          {!active? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow"><h3 className="font-medium mb-2">Welcome</h3><p>Select a system from the sidebar to begin.</p></div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow"><h3 className="font-medium mb-2">Quick Tips</h3><ul className="list-disc ml-5 text-sm text-gray-600 dark:text-gray-300"><li>Use the filter box with Mongo-style keys like data.name</li><li>Create arbitrary resource types (e.g., student, teacher)</li></ul></div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow"><h3 className="font-medium mb-2">Status</h3><p className="text-sm">Authenticated and ready.</p></div>
            </div>
          ):(
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold capitalize">{active.replaceAll('-', ' ')}</h2>
                <div className="flex items-center gap-2">
                  <input className="border rounded px-3 py-2 bg-transparent" placeholder="Resource type (e.g., student)" value={rtype} onChange={e=>setRtype(e.target.value)} />
                  <button className="px-3 py-2 rounded border flex items-center gap-1"><Settings size={16}/> Configure</button>
                </div>
              </div>
              <Analytics token={token} system={active} />
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow">
                <h3 className="font-medium mb-2">Manage Resources: {rtype}</h3>
                <ResourceCRUD token={token} system={active} rtype={rtype} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AppShell(){
  const { token, role, login, logout } = useAuth()
  if(!token) return <Login onLogin={login} />
  return <Dashboard token={token} role={role} />
}

export default function App(){
  return (
    <QueryClientProvider client={client}>
      <AppShell />
    </QueryClientProvider>
  )
}
