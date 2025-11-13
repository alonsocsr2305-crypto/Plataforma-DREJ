#!/bin/bash
# Script de Corrección Automática - VocaRed
# Versión: 1.0
# Fecha: 13 de Noviembre de 2025

echo "🔧 SCRIPT DE CORRECCIÓN AUTOMÁTICA - VOCARED"
echo "=============================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -d "frontend-drej" ] || [ ! -d "backend-drej" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto Plataforma-DREJ-main/"
    echo ""
    echo "Uso correcto:"
    echo "  cd /ruta/a/Plataforma-DREJ-main"
    echo "  bash fix_code.sh"
    exit 1
fi

echo "✅ Directorio correcto detectado"
echo ""

# Contador de correcciones
FIXES=0

# ============================================
# CORRECCIÓN 1: Renombrar commos.css
# ============================================
echo "1️⃣ Verificando commos.css..."

if [ -f "frontend-drej/src/Css/commos.css" ]; then
    echo "   ⚠️  Encontrado: commos.css (typo)"
    echo "   📝 Renombrando a: commons.css"
    
    mv frontend-drej/src/Css/commos.css frontend-drej/src/Css/commons.css
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Archivo renombrado exitosamente"
        FIXES=$((FIXES + 1))
        
        # Buscar y actualizar referencias
        echo "   🔍 Buscando referencias a 'commos.css'..."
        
        REFS=$(grep -rl "commos\.css" frontend-drej/src/ 2>/dev/null | wc -l)
        
        if [ $REFS -gt 0 ]; then
            echo "   📝 Actualizando $REFS archivo(s)..."
            find frontend-drej/src -type f \( -name "*.js" -o -name "*.jsx" \) -exec sed -i.bak 's/commos\.css/commons.css/g' {} \;
            
            # Eliminar backups
            find frontend-drej/src -name "*.bak" -delete
            
            echo "   ✅ Referencias actualizadas"
        else
            echo "   ✅ No hay referencias en el código (perfecto)"
        fi
    else
        echo "   ❌ Error al renombrar archivo"
    fi
else
    echo "   ✅ No existe commos.css (ya está correcto o ya fue renombrado)"
fi

echo ""

# ============================================
# CORRECCIÓN 2: Reportar !important
# ============================================
echo "2️⃣ Analizando !important en CSS..."

TOTAL_IMPORTANT=0

for css_file in frontend-drej/src/Css/*.css; do
    if [ -f "$css_file" ]; then
        COUNT=$(grep -c "!important" "$css_file" 2>/dev/null || echo "0")
        if [ $COUNT -gt 0 ]; then
            TOTAL_IMPORTANT=$((TOTAL_IMPORTANT + COUNT))
            FILENAME=$(basename "$css_file")
            echo "   📊 $FILENAME: $COUNT !important"
        fi
    fi
done

echo ""
echo "   📊 Total de !important: $TOTAL_IMPORTANT"

if [ $TOTAL_IMPORTANT -gt 10 ]; then
    echo "   ⚠️  RECOMENDACIÓN: Reducir a menos de 10"
    echo "   📖 Ver: CORRECCIONES_ESPECIFICAS.md (Sección 2)"
    echo ""
    echo "   💡 Los !important deben eliminarse manualmente para no romper estilos"
    echo "   💡 Sigue la guía en CORRECCIONES_ESPECIFICAS.md"
else
    echo "   ✅ Cantidad aceptable de !important"
fi

echo ""

# ============================================
# VERIFICACIÓN FINAL
# ============================================
echo "=============================================="
echo "📊 RESUMEN DE CORRECCIONES"
echo "=============================================="
echo ""
echo "✅ Correcciones automáticas aplicadas: $FIXES"
echo ""

if [ $FIXES -gt 0 ]; then
    echo "🎉 ¡Correcciones completadas!"
    echo ""
    echo "📝 PRÓXIMOS PASOS:"
    echo ""
    echo "1. Verificar que funcione:"
    echo "   cd frontend-drej"
    echo "   npm start"
    echo ""
    echo "2. Si todo funciona, hacer commit:"
    echo "   git add ."
    echo "   git commit -m 'fix: Rename commos.css to commons.css'"
    echo ""
    echo "3. Para reducir !important (opcional):"
    echo "   Lee: CORRECCIONES_ESPECIFICAS.md"
    echo ""
else
    echo "✅ No se encontraron problemas para corregir automáticamente"
    echo ""
    echo "📖 Para mejoras manuales (reducir !important):"
    echo "   Lee: CORRECCIONES_ESPECIFICAS.md"
    echo ""
fi

# Verificar archivos adicionales
echo "=============================================="
echo "🔍 VERIFICACIÓN ADICIONAL"
echo "=============================================="
echo ""

# Verificar que commons.css existe
if [ -f "frontend-drej/src/Css/commons.css" ]; then
    SIZE=$(wc -c < "frontend-drej/src/Css/commons.css")
    echo "✅ commons.css existe ($SIZE bytes)"
else
    echo "⚠️  commons.css no encontrado"
fi

# Verificar estructura básica
echo ""
echo "📁 Estructura del proyecto:"
echo "   Backend:  $([ -d "backend-drej" ] && echo "✅" || echo "❌") backend-drej/"
echo "   Frontend: $([ -d "frontend-drej" ] && echo "✅" || echo "❌") frontend-drej/"
echo "   - src:    $([ -d "frontend-drej/src" ] && echo "✅" || echo "❌") frontend-drej/src/"
echo "   - CSS:    $([ -d "frontend-drej/src/Css" ] && echo "✅" || echo "❌") frontend-drej/src/Css/"

echo ""
echo "=============================================="
echo "✅ Script completado"
echo "=============================================="
