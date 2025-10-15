import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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