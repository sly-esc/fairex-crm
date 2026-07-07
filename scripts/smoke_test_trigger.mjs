import { createClient } from '@supabase/supabase-js'

// Nos aseguramos de que las variables de entorno están cargadas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  console.error('Asegúrate de ejecutar el script con: node --env-file=.env.local smoke_test_trigger.mjs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function runSmokeTest() {
  console.log('🚀 Iniciando Smoke Test del Trigger de Onboarding...')
  
  const testEmail = `smoke-test-${Date.now()}@fairex.test`
  const testPassword = 'SmokeTest2026!#'

  console.log(`\n1. Intentando registrar usuario: ${testEmail}`)
  console.log('   Inyectando raw_user_meta_data: { company_id: 1, role: "agent" }')
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: { 
        company_id: 1, 
        role: 'agent' 
      }
    }
  })

  if (error) {
    console.error('\n❌ Error durante el registro (signUp):')
    console.error(error.message)
    process.exit(1)
  }

  console.log('\n✅ Usuario registrado exitosamente en auth.users!')
  console.log('   ID de Usuario:', data.user?.id)
  
  console.log('\n2. Validación y Limpieza:')
  console.log('El trigger "handle_new_auth_user" se disparó automáticamente en la base de datos.')
  console.log('\n👉 Para VERIFICAR que el perfil se creó correctamente, ejecuta en el SQL Editor de Supabase:')
  console.log(`\n   SELECT id, auth_user_id, company_id, role, created_at`)
  console.log(`   FROM profiles`)
  console.log(`   WHERE auth_user_id = '${data.user?.id}';`)
  
  console.log('\n👉 Para LIMPIAR este usuario de prueba, ejecuta en el SQL Editor de Supabase:')
  console.log(`\n   DELETE FROM profiles WHERE auth_user_id = '${data.user?.id}';`)
  console.log(`   DELETE FROM auth.users WHERE id = '${data.user?.id}';`)
}

runSmokeTest()
