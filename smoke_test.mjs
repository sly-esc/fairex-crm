import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// 1. Cargar variables de entorno usando dotenv
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runSmokeTest() {
  console.log("=========================================");
  console.log("SMOKE TEST AISLADO: auth.admin.createUser");
  console.log("=========================================\n");

  const testEmail = `smoke.test.${Date.now()}@fairex.com`;
  let userId = null;
  let testPassed = true;

  try {
    // 0️⃣ Obtener una empresa real para la prueba
    console.log("0️⃣  Obteniendo una empresa existente para la prueba...");
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
      .single();

    if (companyError || !companyData) {
      console.error("   ❌ Error: No se pudo encontrar una empresa existente en la base de datos.");
      console.error("      Asegúrese de que la tabla 'companies' tenga al menos un registro.");
      testPassed = false;
      return;
    }
    
    const testCompanyId = companyData.id;
    console.log(`   ✅ Empresa seleccionada. ID: ${testCompanyId}`);

    // PASO 1: Creación Oficial
    console.log("\n1️⃣  Creando usuario vía API Oficial (Supabase Auth)...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'PasswordSeguro123!',
      email_confirm: true,
      user_metadata: {
        company_id: testCompanyId,
        role: 'owner'
      }
    });

    if (authError) {
      console.error("   ❌ Error del API de Auth:", authError.message);
      testPassed = false;
      return;
    }

    userId = authData.user.id;
    console.log(`   ✅ Usuario creado con éxito en auth.users. UUID: ${userId}`);
    console.log(`   📧 Email temporal: ${testEmail}`);

    // PASO 2: Verificación del Trigger
    console.log("\n2️⃣  Verificando que el trigger actuó en profiles...");
    await new Promise(r => setTimeout(r, 500)); // Breve pausa para asegurar latencia del trigger

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, auth_user_id, company_id, role')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error("   ❌ FALLO: El perfil no se generó. El trigger falló o fue revertido.", profileError);
      testPassed = false;
    } else {
      console.log("   ✅ ÉXITO TOTAL: El perfil apareció automáticamente.");
      console.log(`      - auth_user_id: ${profile.auth_user_id}`);
      console.log(`      - company_id:   ${profile.company_id}`);
      console.log(`      - role:         ${profile.role}`);
      
      if (profile.company_id === testCompanyId && profile.role === 'owner') {
        console.log("   ✅ Los datos coinciden exactamente con el contrato enviado.");
      } else {
        console.error("   ❌ FALLO: Los datos creados difieren del contrato.");
        testPassed = false;
      }
    }
  } catch (err) {
    console.error("   ❌ Error inesperado durante la prueba:", err);
    testPassed = false;
  } finally {
    // PASO 3: Limpieza Incondicional
    if (userId) {
      console.log("\n3️⃣  Limpiando el entorno incondicionalmente (try/finally)...");
      
      // Borramos el perfil manualmente primero para no depender del CASCADE de PostgreSQL
      const { error: deleteProfileError } = await supabase.from('profiles').delete().eq('auth_user_id', userId);
      if (deleteProfileError) {
        console.error("   ❌ Error limpiando profiles:", deleteProfileError.message);
        testPassed = false;
      } else {
        console.log(`   ✅ Perfil temporal eliminado limpiamente de profiles.`);
      }
      
      // Borramos el usuario de Auth utilizando la API oficial Admin
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error("   ❌ Error limpiando auth.users:", deleteError.message);
        testPassed = false;
      } else {
        console.log(`   ✅ Usuario temporal (${testEmail}) eliminado limpiamente de auth.users.`);
      }
    }

    console.log("\n=========================================");
    if (testPassed) {
      console.log("✅ PRUEBA FINALIZADA CON ÉXITO");
      process.exit(0);
    } else {
      console.log("❌ PRUEBA FINALIZADA CON ERRORES");
      process.exit(1);
    }
  }
}

runSmokeTest();
