# 🧬 Genoma - Guía de Instalación

## Instalación Rápida

### Para Usuarios

```bash
# Opción 1: Instalación interactiva
npx genoma-setup

# Opción 2: Instalación rápida con OpenAI
npx genoma-setup --quick --provider openai

# Opción 3: Instalación global
npm install -g genoma
genoma setup
```

### Para Desarrolladores

```bash
# Clonar repositorio
git clone https://github.com/LuisvelMarketer/genoma.git
cd genoma

# Instalar dependencias y configurar
pnpm install
pnpm setup:dev

# Iniciar en modo desarrollo
pnpm dev
```

---

## Requisitos del Sistema

### Obligatorios

| Requisito | Versión Mínima | Verificar |
|-----------|----------------|----------|
| Node.js | >= 22.12.0 | `node --version` |
| pnpm | >= 10.0.0 | `pnpm --version` |
| Git | >= 2.0 | `git --version` |

### Opcionales

| Requisito | Propósito |
|-----------|----------|
| Docker | Sandbox isolation |
| PostgreSQL | Persistencia PGA |
| Playwright | Browser automation |

---

## Modos de Instalación

### Modo Usuario (Producción)

Para usuarios finales que quieren usar Genoma sin modificar el código.

```bash
genoma setup
```

Características:
- ✅ Wizard interactivo
- ✅ Configuración simplificada
- ✅ Auto-evolución PGA
- ✅ Logs optimizados

### Modo Desarrollador

Para desarrolladores que quieren contribuir o personalizar.

```bash
pnpm setup:dev
```

Características:
- ✅ Acceso completo al código
- ✅ Hot reload
- ✅ Debug mode
- ✅ Logs verbosos
- ✅ Tests disponibles

---

## Comandos Post-Instalación

```bash
# Iniciar Genoma
genoma start

# Ver estado
genoma status

# Detener
genoma stop

# Diagnosticar problemas
genoma doctor

# Ver/editar configuración
genoma config --show
genoma config --edit
```

---

## Configuración de Proveedores IA

### OpenAI

```bash
export OPENAI_API_KEY="sk-your-key-here"
genoma setup --provider openai
```

### Anthropic (Claude)

```bash
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
genoma setup --provider anthropic
```

### Google (Gemini)

```bash
export GEMINI_API_KEY="your-key-here"
genoma setup --provider google
```

### Modelos Locales (Ollama)

```bash
# Instalar Ollama primero: https://ollama.ai
ollama pull llama3
genoma setup --provider ollama
```

---

## Configuración de Canales

### Terminal (CLI)
Habilitado por defecto.

### Telegram

1. Crea un bot con @BotFather
2. Obtén el token
3. Configura:
   ```bash
   export TELEGRAM_BOT_TOKEN="123456:ABC..."
   ```

### Discord

1. Crea una aplicación en Discord Developer Portal
2. Obtén el token del bot
3. Configura:
   ```bash
   export DISCORD_BOT_TOKEN="your-token"
   ```

### Slack

1. Crea una app en Slack API
2. Obtén los tokens
3. Configura:
   ```bash
   export SLACK_BOT_TOKEN="xoxb-..."
   export SLACK_APP_TOKEN="xapp-..."
   ```

---

## Archivos de Configuración

```
~/.genoma/
├── .env              # Variables de entorno
├── genoma.json       # Configuración principal
├── state/            # Estado persistente
│   ├── gateway.db    # Base de datos gateway
│   └── pga/          # Datos de evolución
└── logs/             # Logs de aplicación
```

---

## Solución de Problemas

### Error: Node.js version incompatible

```bash
# Instalar Node.js 22+
nvm install 22
nvm use 22
```

### Error: pnpm not found

```bash
npm install -g pnpm
```

### Error: Puerto en uso

```bash
# Usar otro puerto
genoma start --port 18790
```

### Diagnóstico completo

```bash
genoma doctor
```

---

## Actualización

### Usuario

```bash
genoma update
```

### Desarrollador

```bash
git pull origin main
pnpm install
pnpm build
```

---

## Soporte

- **Documentación**: https://github.com/LuisvelMarketer/genoma
- **Issues**: https://github.com/LuisvelMarketer/genoma/issues
- **Discord**: [Link al servidor]

---

© 2026 Genoma Team | MIT License
