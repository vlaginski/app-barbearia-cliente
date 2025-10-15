import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Criar cliente apenas se as variáveis estiverem disponíveis
let supabase: any = null

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
  // Durante o build ou quando variáveis não estão configuradas
  console.warn('Variáveis de ambiente do Supabase não configuradas')
}

export { supabase }

// Tipos para o banco de dados
export interface User {
  id: string
  email: string
  name: string
  phone: string
  password?: string // Campo opcional para senha
  role: 'admin' | 'user'
  created_at: string
}

export interface Appointment {
  id: string
  user_id: string
  date: string
  time: string
  service: string
  barber: string
  status: 'agendado' | 'cancelado' | 'concluido'
  price: number
  client_name: string
  client_phone: string
  created_at: string
}