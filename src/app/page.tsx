"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Scissors, User, Phone, Mail, Plus, Home, Settings, LogOut, CalendarDays, CreditCard, X, ArrowLeft, Menu, Eye, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

// Importação condicional do Supabase
let supabase: any = null
try {
  if (typeof window !== 'undefined') {
    const supabaseModule = require('@/lib/supabase')
    supabase = supabaseModule.supabase
  }
} catch (error) {
  console.log('Supabase não configurado')
}

interface Appointment {
  id: string
  date: string
  time: string
  service: string
  barber: string
  status: 'agendado' | 'cancelado' | 'concluido'
  price: number
  clientName: string
  clientPhone: string
}

const barbers = [
  { id: '1', name: 'Carlos Silva' },
  { id: '2', name: 'João Santos' },
  { id: '3', name: 'Pedro Lima' },
  { id: '4', name: 'Rafael Costa' }
]

export default function BarbershopApp() {
  const { user, loading, login, register, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('login')
  const [appointmentTab, setAppointmentTab] = useState('agendados')
  const [adminAppointmentTab, setAdminAppointmentTab] = useState('hoje')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]) // Para admin
  const [showNewAppointment, setShowNewAppointment] = useState(false)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [showPlanAdvantages, setShowPlanAdvantages] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [registerError, setRegisterError] = useState('')
  
  // Estados do formulário
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [appointmentForm, setAppointmentForm] = useState({ date: '', time: '', service: 'Corte Simples', barber: '' })

  // Carregar agendamentos do usuário
  useEffect(() => {
    if (user && supabase) {
      loadUserAppointments()
      if (user.role === 'admin') {
        loadAllAppointments() // Carregar todos os agendamentos para admin
      }
      setActiveTab('agendamentos')
    }
  }, [user])

  const loadUserAppointments = async () => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })

      if (error) throw error

      const formattedAppointments = data.map((apt: any) => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        service: apt.service,
        barber: apt.barber,
        status: apt.status,
        price: apt.price,
        clientName: apt.client_name,
        clientPhone: apt.client_phone
      }))

      setAppointments(formattedAppointments)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    }
  }

  // Carregar TODOS os agendamentos para admin
  const loadAllAppointments = async () => {
    if (!user || user.role !== 'admin' || !supabase) return

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error

      const formattedAppointments = data.map((apt: any) => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        service: apt.service,
        barber: apt.barber,
        status: apt.status,
        price: parseFloat(apt.price),
        clientName: apt.client_name,
        clientPhone: apt.client_phone
      }))

      setAllAppointments(formattedAppointments)
    } catch (error) {
      console.error('Erro ao carregar todos os agendamentos:', error)
    }
  }

  // Login com validação real
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    if (!loginForm.email || !loginForm.password) {
      setLoginError('Preencha todos os campos')
      return
    }

    const result = await login(loginForm.email, loginForm.password)
    
    if (!result.success) {
      setLoginError(result.error || 'Erro ao fazer login')
    }
  }

  // Cadastro com validação real
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterError('')

    if (!registerForm.name || !registerForm.email || !registerForm.phone || !registerForm.password) {
      setRegisterError('Preencha todos os campos')
      return
    }

    const result = await register(registerForm.name, registerForm.email, registerForm.phone, registerForm.password)
    
    if (!result.success) {
      setRegisterError(result.error || 'Erro ao criar conta')
    }
  }

  // Função para abrir popup de upgrade PRIMEIRO (no primeiro botão)
  const handleNewAppointmentClick = () => {
    setShowUpgradePopup(true)
  }

  // Agendar corte - agora salva no banco
  const handleScheduleAttempt = async (e: React.FormEvent) => {
    e.preventDefault()
    if (appointmentForm.date && appointmentForm.time && appointmentForm.barber) {
      await confirmSchedule()
    }
  }

  // Confirmar agendamento
  const confirmSchedule = async () => {
    if (!user || !supabase) return

    const servicePrice = {
      'Corte Simples': 25,
      'Corte + Barba': 40,
      'Corte Premium': 50,
      'Barba': 20
    }
    
    const selectedBarber = barbers.find(b => b.id === appointmentForm.barber)
    
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            user_id: user.id,
            date: appointmentForm.date,
            time: appointmentForm.time,
            service: appointmentForm.service,
            barber: selectedBarber?.name || '',
            status: 'agendado',
            price: servicePrice[appointmentForm.service as keyof typeof servicePrice],
            client_name: user.name,
            client_phone: user.phone
          }
        ])
        .select()
        .single()

      if (error) throw error

      // Atualizar lista local
      await loadUserAppointments()
      if (user.role === 'admin') {
        await loadAllAppointments()
      }
      
      setAppointmentForm({ date: '', time: '', service: 'Corte Simples', barber: '' })
      setShowNewAppointment(false)
      setShowUpgradePopup(false)
    } catch (error) {
      console.error('Erro ao agendar:', error)
    }
  }

  // Função para quando clica "não tenho interesse" - abre modal de agendamento
  const handleNoInterest = () => {
    setShowUpgradePopup(false)
    setShowNewAppointment(true)
  }

  // Cancelar agendamento
  const cancelAppointment = async (id: string) => {
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelado' })
        .eq('id', id)

      if (error) throw error

      // Atualizar lista local
      await loadUserAppointments()
      if (user && user.role === 'admin') {
        await loadAllAppointments()
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
    }
  }

  // Logout
  const handleLogout = () => {
    logout()
    setActiveTab('login')
    setAppointments([])
    setAllAppointments([])
    setSidebarOpen(false)
  }

  // Função para mostrar vantagens do plano específico
  const handleShowAdvantages = (planName: string) => {
    setSelectedPlan(planName)
    setShowPlanAdvantages(true)
  }

  // Filtrar agendamentos por data
  const getAppointmentsByDate = (date: string) => {
    return allAppointments.filter(apt => apt.date === date)
  }

  // Obter data de hoje e amanhã
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-black mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Scissors className="h-12 w-12 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">BarberShop</h1>
            <p className="text-gray-600">Faça login para continuar</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Fazer Login</CardTitle>
                  <CardDescription>Entre com sua conta existente</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {loginError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {loginError}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-black hover:bg-gray-800">
                      Entrar
                    </Button>
                  </form>

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Criar Conta</CardTitle>
                  <CardDescription>Cadastre-se para agendar seus cortes</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    {registerError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {registerError}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                        placeholder="João Silva"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                        placeholder="seu@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="reg-password">Senha</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full bg-black hover:bg-gray-800">
                      Criar Conta
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Scissors className="h-6 w-6 lg:h-8 lg:w-8 text-black mr-2 lg:mr-3" />
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">BarberShop</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('agendamentos')
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                activeTab === 'agendamentos' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarDays className="h-5 w-5 mr-3" />
              Agendamentos
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => {
                  setActiveTab('visualizar-agendamentos')
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                  activeTab === 'visualizar-agendamentos' 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Eye className="h-5 w-5 mr-3" />
                Ver Agendamentos
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('planos')
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                activeTab === 'planos' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CreditCard className="h-5 w-5 mr-3" />
              Planos
            </button>
            <button
              onClick={() => {
                setActiveTab('perfil')
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                activeTab === 'perfil' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="h-5 w-5 mr-3" />
              Perfil
            </button>
            <button
              onClick={() => {
                setActiveTab('configuracoes')
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                activeTab === 'configuracoes' 
                  ? 'bg-gray-100 text-gray-900 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Settings className="h-5 w-5 mr-3" />
              Configurações
            </button>
          </div>
        </nav>

        {/* User info and logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {user.role === 'admin' && (
                <Badge className="bg-blue-600 text-white text-xs mt-1">Admin</Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center">
              <Scissors className="h-6 w-6 text-black mr-2" />
              <h1 className="text-lg font-bold text-gray-900">BarberShop</h1>
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
        </div>

        {activeTab === 'agendamentos' && (
          <div className="flex-1 p-4 lg:p-6">
            {/* Header with tabs */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Agendamentos</h2>
                <Button 
                  onClick={handleNewAppointmentClick}
                  className="bg-black hover:bg-gray-800 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo agendamento
                </Button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 sm:space-x-8">
                  <button
                    onClick={() => setAppointmentTab('agendados')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      appointmentTab === 'agendados'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Agendados
                  </button>
                  <button
                    onClick={() => setAppointmentTab('anteriores')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      appointmentTab === 'anteriores'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Anteriores
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              {appointmentTab === 'agendados' && (
                <div>
                  {appointments.filter(apt => apt.status === 'agendado').length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento</h3>
                      <p className="text-gray-500 mb-4">Você não possui agendamentos ativos no momento.</p>
                      <Button 
                        onClick={handleNewAppointmentClick}
                        className="bg-black hover:bg-gray-800"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Fazer agendamento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments
                        .filter(apt => apt.status === 'agendado')
                        .map((appointment) => (
                          <Card key={appointment.id}>
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Scissors className="h-6 w-6 text-gray-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-gray-900">{appointment.service}</h3>
                                    <p className="text-sm text-gray-600 mb-1">Barbeiro: {appointment.barber}</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-3">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {appointment.time}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                                  <span className="text-lg font-medium text-gray-900">
                                    R$ {appointment.price}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => cancelAppointment(appointment.id)}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {appointmentTab === 'anteriores' && (
                <div>
                  {appointments.filter(apt => apt.status !== 'agendado').length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum histórico</h3>
                      <p className="text-gray-500">Você não possui agendamentos anteriores.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments
                        .filter(apt => apt.status !== 'agendado')
                        .map((appointment) => (
                          <Card key={appointment.id}>
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Scissors className="h-6 w-6 text-gray-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-medium text-gray-900">{appointment.service}</h3>
                                    <p className="text-sm text-gray-600 mb-1">Barbeiro: {appointment.barber}</p>
                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-1 sm:gap-3">
                                      <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                      </div>
                                      <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {appointment.time}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                                  <span className="text-lg font-medium text-gray-900">
                                    R$ {appointment.price}
                                  </span>
                                  <Badge variant={appointment.status === 'cancelado' ? 'secondary' : 'default'}>
                                    {appointment.status === 'cancelado' ? 'Cancelado' : 'Concluído'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nova seção para visualizar agendamentos (Dono/Funcionários) - APENAS ADMIN */}
        {activeTab === 'visualizar-agendamentos' && user.role === 'admin' && (
          <div className="flex-1 p-4 lg:p-6">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Visualizar Agendamentos</h2>
                  <p className="text-gray-600">Área para dono e funcionários visualizarem todos os agendamentos</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  <span className="text-sm text-gray-500">Acesso Administrativo</span>
                </div>
              </div>

              {/* Tabs para diferentes visualizações */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 sm:space-x-8">
                  <button
                    onClick={() => setAdminAppointmentTab('hoje')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      adminAppointmentTab === 'hoje'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setAdminAppointmentTab('amanha')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      adminAppointmentTab === 'amanha'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Amanhã
                  </button>
                  <button
                    onClick={() => setAdminAppointmentTab('todos')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      adminAppointmentTab === 'todos'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setAdminAppointmentTab('historico')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      adminAppointmentTab === 'historico'
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Histórico
                  </button>
                </nav>
              </div>
            </div>

            {/* Conteúdo das abas administrativas */}
            <div className="flex-1">
              {adminAppointmentTab === 'hoje' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Agendamentos de Hoje - {new Date().toLocaleDateString('pt-BR')}
                    </h3>
                  </div>
                  {getAppointmentsByDate(today).filter(apt => apt.status === 'agendado').length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento hoje</h3>
                      <p className="text-gray-500">Não há agendamentos para hoje.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getAppointmentsByDate(today)
                        .filter(apt => apt.status === 'agendado')
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment) => (
                          <Card key={appointment.id} className="border-l-4 border-l-green-500">
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Scissors className="h-6 w-6 text-green-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                      <h3 className="font-medium text-gray-900">{appointment.service}</h3>
                                      <Badge className="bg-green-600 text-white w-fit">
                                        {appointment.time}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        Cliente: {appointment.clientName}
                                      </div>
                                      <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2" />
                                        {appointment.clientPhone}
                                      </div>
                                      <div className="flex items-center">
                                        <Scissors className="h-4 w-4 mr-2" />
                                        Barbeiro: {appointment.barber}
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-lg font-medium text-gray-900">
                                          R$ {appointment.price}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {adminAppointmentTab === 'amanha' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Agendamentos de Amanhã - {new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                    </h3>
                  </div>
                  {getAppointmentsByDate(tomorrow).filter(apt => apt.status === 'agendado').length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento amanhã</h3>
                      <p className="text-gray-500">Não há agendamentos para amanhã ainda.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getAppointmentsByDate(tomorrow)
                        .filter(apt => apt.status === 'agendado')
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((appointment) => (
                          <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4 lg:p-6">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Scissors className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                      <h3 className="font-medium text-gray-900">{appointment.service}</h3>
                                      <Badge className="bg-blue-600 text-white w-fit">
                                        {appointment.time}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                      <div className="flex items-center">
                                        <User className="h-4 w-4 mr-2" />
                                        Cliente: {appointment.clientName}
                                      </div>
                                      <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2" />
                                        {appointment.clientPhone}
                                      </div>
                                      <div className="flex items-center">
                                        <Scissors className="h-4 w-4 mr-2" />
                                        Barbeiro: {appointment.barber}
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-lg font-medium text-gray-900">
                                          R$ {appointment.price}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {adminAppointmentTab === 'todos' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Todos os Agendamentos Ativos</h3>
                  </div>
                  <div className="space-y-4">
                    {allAppointments
                      .filter(apt => apt.status === 'agendado')
                      .sort((a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
                      .map((appointment) => (
                        <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4 lg:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Scissors className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{appointment.service}</h3>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline">
                                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                      </Badge>
                                      <Badge className="bg-blue-600 text-white">
                                        {appointment.time}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-2" />
                                      Cliente: {appointment.clientName}
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="h-4 w-4 mr-2" />
                                      {appointment.clientPhone}
                                    </div>
                                    <div className="flex items-center">
                                      <Scissors className="h-4 w-4 mr-2" />
                                      Barbeiro: {appointment.barber}
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-lg font-medium text-gray-900">
                                        R$ {appointment.price}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {adminAppointmentTab === 'historico' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Histórico de Agendamentos</h3>
                  </div>
                  <div className="space-y-4">
                    {allAppointments
                      .filter(apt => apt.status !== 'agendado')
                      .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                      .map((appointment) => (
                        <Card key={appointment.id} className={`border-l-4 ${appointment.status === 'concluido' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                          <CardContent className="p-4 lg:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  appointment.status === 'concluido' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                  <Scissors className={`h-6 w-6 ${
                                    appointment.status === 'concluido' ? 'text-green-600' : 'text-red-600'
                                  }`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{appointment.service}</h3>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline">
                                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                      </Badge>
                                      <Badge variant="outline">
                                        {appointment.time}
                                      </Badge>
                                      <Badge variant={appointment.status === 'concluido' ? 'default' : 'secondary'}>
                                        {appointment.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                      <User className="h-4 w-4 mr-2" />
                                      Cliente: {appointment.clientName}
                                    </div>
                                    <div className="flex items-center">
                                      <Phone className="h-4 w-4 mr-2" />
                                      {appointment.clientPhone}
                                    </div>
                                    <div className="flex items-center">
                                      <Scissors className="h-4 w-4 mr-2" />
                                      Barbeiro: {appointment.barber}
                                    </div>
                                    <div className="flex items-center">
                                      <span className="text-lg font-medium text-gray-900">
                                        R$ {appointment.price}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'planos' && !showPlanAdvantages && (
          <div className="flex-1 p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Planos de Assinatura</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-w-6xl">
              
              {/* Plano 1 - Clube de Corte Ilimitado */}
              <Card className="border border-gray-200 p-3">
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Clube de Corte Ilimitado</h3>
                  <p className="text-xs text-gray-600">Tempo de vigência: Indeterminado</p>
                  <div className="text-base font-bold text-black">R$ 84,90</div>
                  <p className="text-xs text-gray-500">Por mês</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => handleShowAdvantages('Clube de Corte Ilimitado')}
                  >
                    Confira as vantagens
                  </Button>
                </div>
              </Card>

              {/* Plano 2 - Clube de Corte - Seg a Quarta */}
              <Card className="border border-gray-200 p-3">
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Clube de Corte - Seg a Quarta</h3>
                  <p className="text-xs text-gray-600">Tempo de vigência: Indeterminado</p>
                  <div className="text-base font-bold text-black">R$ 76,90</div>
                  <p className="text-xs text-gray-500">Por mês</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => handleShowAdvantages('Clube de Corte - Seg a Quarta')}
                  >
                    Confira as vantagens
                  </Button>
                </div>
              </Card>

              {/* Plano 3 - Clube de Corte e Barba Ilimitado */}
              <Card className="border border-gray-200 p-3">
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Clube de Corte e Barba Ilimitado</h3>
                  <p className="text-xs text-gray-600">Tempo de vigência: Indeterminado</p>
                  <div className="text-base font-bold text-black">R$ 149,90</div>
                  <p className="text-xs text-gray-500">Por mês</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => handleShowAdvantages('Clube de Corte e Barba Ilimitado')}
                  >
                    Confira as vantagens
                  </Button>
                </div>
              </Card>

              {/* Plano 4 - Clube de Corte e Barba - Seg a Quarta */}
              <Card className="border border-gray-200 p-3">
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Clube de Corte e Barba - Seg a Quarta</h3>
                  <p className="text-xs text-gray-600">Tempo de vigência: Indeterminado</p>
                  <div className="text-base font-bold text-black">R$ 134,90</div>
                  <p className="text-xs text-gray-500">Por mês</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => handleShowAdvantages('Clube de Corte e Barba - Seg a Quarta')}
                  >
                    Confira as vantagens
                  </Button>
                </div>
              </Card>

              {/* Plano 5 - Clube de Barba Ilimitado */}
              <Card className="border border-gray-200 p-3">
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Clube de Barba Ilimitado</h3>
                  <p className="text-xs text-gray-600">Tempo de vigência: Indeterminado</p>
                  <div className="text-base font-bold text-black">R$ 94,90</div>
                  <p className="text-xs text-gray-500">Por mês</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => handleShowAdvantages('Clube de Barba Ilimitado')}
                  >
                    Confira as vantagens
                  </Button>
                </div>
              </Card>

              {/* Plano 6 - Clube de Barba - Seg a Quarta */}
              <Card className="border border-gray-200 p-3">
                <div className="text-center space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900">Clube de Barba - Seg a Quarta</h3>
                  <p className="text-xs text-gray-600">Tempo de vigência: Indeterminado</p>
                  <div className="text-base font-bold text-black">R$ 85,90</div>
                  <p className="text-xs text-gray-500">Por mês</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs h-8 mt-2"
                    onClick={() => handleShowAdvantages('Clube de Barba - Seg a Quarta')}
                  >
                    Confira as vantagens
                  </Button>
                </div>
              </Card>

            </div>
          </div>
        )}

        {/* Tela de Vantagens do Plano */}
        {activeTab === 'planos' && showPlanAdvantages && (
          <div className="flex-1 p-4 lg:p-6">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setShowPlanAdvantages(false)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos planos
              </Button>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900">{selectedPlan}</h2>
              <p className="text-gray-600">Confira todas as vantagens do seu plano</p>
            </div>

            <div className="space-y-4 max-w-2xl">
              {/* Clube de Corte Ilimitado - APENAS CORTE */}
              {selectedPlan === 'Clube de Corte Ilimitado' && (
                <Card className="bg-white shadow-md">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Corte</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-black text-white">100% OFF</Badge>
                        <span className="line-through text-gray-500 text-sm">De R$ 45,00</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="text-xl font-bold text-black">Por R$ 0,00</span>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-md inline-block mb-2">
                      GRÁTIS
                    </div>
                    <p className="text-gray-600 text-sm">Ilimitados por mês</p>
                    <p className="text-gray-600 text-sm">Segunda, terça, quarta, quinta, sexta ou sábado.</p>
                  </CardContent>
                </Card>
              )}

              {/* Clube de Corte e Barba Ilimitado - CORTE E BARBA */}
              {selectedPlan === 'Clube de Corte e Barba Ilimitado' && (
                <>
                  <Card className="bg-white shadow-md">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                        <h3 className="text-lg font-bold text-gray-900">Corte</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-black text-white">100% OFF</Badge>
                          <span className="line-through text-gray-500 text-sm">De R$ 45,00</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="text-xl font-bold text-black">Por R$ 0,00</span>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-md inline-block mb-2">
                        GRÁTIS
                      </div>
                      <p className="text-gray-600 text-sm">Ilimitados por mês</p>
                      <p className="text-gray-600 text-sm">Segunda, terça, quarta, quinta, sexta ou sábado.</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-md">
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                        <h3 className="text-lg font-bold text-gray-900">Barba</h3>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-black text-white">100% OFF</Badge>
                          <span className="line-through text-gray-500 text-sm">De R$ 40,00</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <span className="text-xl font-bold text-black">Por R$ 0,00</span>
                      </div>
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-md inline-block mb-2">
                        GRÁTIS
                      </div>
                      <p className="text-gray-600 text-sm">Ilimitados por mês</p>
                      <p className="text-gray-600 text-sm">Segunda, terça, quarta, quinta, sexta ou sábado.</p>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Clube de Barba Ilimitado - APENAS BARBA */}
              {selectedPlan === 'Clube de Barba Ilimitado' && (
                <Card className="bg-white shadow-md">
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                      <h3 className="text-lg font-bold text-gray-900">Barba</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-black text-white">100% OFF</Badge>
                        <span className="line-through text-gray-500 text-sm">De R$ 40,00</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <span className="text-xl font-bold text-black">Por R$ 0,00</span>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-md inline-block mb-2">
                      GRÁTIS
                    </div>
                    <p className="text-gray-600 text-sm">Ilimitados por mês</p>
                    <p className="text-gray-600 text-sm">Segunda, terça, quarta, quinta, sexta ou sábado.</p>
                  </CardContent>
                </Card>
              )}

              {/* Para outros planos, mostrar mensagem padrão */}
              {!['Clube de Corte Ilimitado', 'Clube de Corte e Barba Ilimitado', 'Clube de Barba Ilimitado'].includes(selectedPlan) && (
                <Card className="bg-white shadow-md">
                  <CardContent className="p-4 lg:p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Vantagens do Plano</h3>
                    <p className="text-gray-600">As vantagens específicas deste plano serão exibidas em breve.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="flex-1 p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h2>
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Gerencie suas informações de conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className="bg-green-600">Ativo</Badge>
                  </div>
                  <div>
                    <Label>Tipo de Conta</Label>
                    <Badge className={user.role === 'admin' ? 'bg-blue-600' : 'bg-gray-600'}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'configuracoes' && (
          <div className="flex-1 p-4 lg:p-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6">Configurações</h2>
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
                <CardDescription>Configure suas preferências do aplicativo</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Configurações em desenvolvimento...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal para novo agendamento */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Agendamento</CardTitle>
              <CardDescription>Escolha a data, horário, barbeiro e tipo de serviço</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScheduleAttempt} className="space-y-4">
                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Horário</Label>
                  <select
                    id="time"
                    value={appointmentForm.time}
                    onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="">Selecione um horário</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="barber">Barbeiro</Label>
                  <select
                    id="barber"
                    value={appointmentForm.barber}
                    onChange={(e) => setAppointmentForm({...appointmentForm, barber: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="">Selecione um barbeiro</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="service">Tipo de Serviço</Label>
                  <select
                    id="service"
                    value={appointmentForm.service}
                    onChange={(e) => setAppointmentForm({...appointmentForm, service: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="Corte Simples">Corte Simples - R$ 25</option>
                    <option value="Corte + Barba">Corte + Barba - R$ 40</option>
                    <option value="Corte Premium">Corte Premium - R$ 50</option>
                    <option value="Barba">Apenas Barba - R$ 20</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewAppointment(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-black hover:bg-gray-800">
                    Fazer agendamento
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popup de Upgrade */}
      {showUpgradePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUpgradePopup(false)}
                className="absolute right-2 top-2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <CardTitle className="text-center">Upgrade de Plano</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg text-gray-900 mb-2">
                  Faça um upgrade para um de nossos planos, e garanta descontos exclusivos!
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setShowUpgradePopup(false)
                    setActiveTab('planos')
                  }}
                  className="w-full bg-black hover:bg-gray-800"
                >
                  Quero conferir os planos
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleNoInterest}
                  className="w-full"
                >
                  Não tenho interesse
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}