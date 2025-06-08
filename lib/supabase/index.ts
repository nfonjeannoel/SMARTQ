// Supabase client exports
// Central export point for all Supabase configurations and utilities

// Client-side exports (safe for browser)
export { supabase, default as supabaseClient } from './client'
export type { SupabaseClient } from './client'

// Server-side exports (server-only)
export { 
  supabaseServer, 
  createServiceRoleClient, 
  createAnonClientOnServer,
  default as supabaseServerClient 
} from './server'
export type { SupabaseServerClient } from './server'

// Testing utilities
export {
  testClientConnection,
  testServerConnection,
  testRLSPolicies,
  testDatabaseFunctions,
  testQueueView,
  runConnectionTests
} from './test-connection'
export type { ConnectionTestResult } from './test-connection'

// Database types (re-export for convenience)
export type {
  Database,
  User,
  UserInsert,
  UserUpdate,
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
  WalkIn,
  WalkInInsert,
  WalkInUpdate,
  QueueItem,
  AppointmentStatus,
  WalkInStatus,
  AppointmentStatusType,
  WalkInStatusType
} from '../types/database' 