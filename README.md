# 💸 Cuentas Claras

Una aplicación web/PWA rápida, sin fricción y pensada para resolver cuentas en el momento. Diseñada específicamente para juntadas, asados y salidas grupales donde se necesita registrar gastos sobre la marcha y conocer de forma transparente cuánto le debe pagar cada participante a quién, ítem por ítem.

---

## 🌐 Demo en Vivo

La aplicación se encuentra desplegada y disponible para su uso público con certificado SSL (HTTPS):

👉 **Probar la app:** [https://money-management-app-eight.vercel.app/](https://money-management-app-eight.vercel.app/)

---

## 🚀 Características Principales

* **Cero Registro (Guest-First):** No requiere crear cuentas, verificar correos ni iniciar sesión. Creás la juntada en un toque y cargás los participantes al instante.
* **Carga Rápida en Vivo:** Registrá compras a medida que ocurren (comida, bebidas, transporte) indicando quién puso la plata y entre quiénes se divide el consumo.
* **Liquidación Directa por Ítem:** Cada participante responde únicamente por los productos que efectivamente consumió. El pago se realiza de forma directa a quien hizo la compra, eliminando compensaciones cruzadas confusas.
* **Resumen Limpio con Tarjetas de Gasto:** Modal intuitivo que consolida la información esencial por compra: cuota por persona (`$ c/u`), acreedor, lista de deudores y alias de cobro.
* **Integración Directa con WhatsApp:** Botón dedicado con la identidad de WhatsApp que abre la aplicación con el mensaje detallado listo para enviar a grupos o contactos (emojis, desglose por ítem y alias).
* **Persistencia Local Automática:** Todos los gastos y participantes se sincronizan en el almacenamiento local del navegador (`localStorage`), evitando la pérdida de datos si se cierra la pestaña o se recarga la página.
* **Compatibilidad Móvil Universal:** Generación de identificadores con fallback seguro para permitir la carga fluida tanto en red local (`HTTP`) como en entornos de producción con `HTTPS`.
* **Diseño Mobile-First Accesible:** Interfaz oscura y minimalista optimizada para operar con una sola mano en pantallas táctiles.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Base:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)[cite: 1]
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)[cite: 1]
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)[cite: 1]
* **Deploy & CI/CD:** [Vercel](https://vercel.com/)
* **Diseño y Prototipado:** [Figma](https://www.figma.com/)[cite: 1]
* **Iconografía:** [Lucide Icons](https://lucide.dev/)[cite: 1]

---

## 📱 Capturas de Pantalla
<img width="347" height="761" alt="image" src="https://github.com/user-attachments/assets/d5f46be9-6d4f-48fe-8991-41f5dd398c47" />

<img width="345" height="752" alt="image" src="https://github.com/user-attachments/assets/0600f520-0d17-4490-a5ab-cdebadee85b5" />

---

## ⚙️ Instalación y Configuración Local

Seguí estos pasos para levantar el entorno de desarrollo en tu computadora:

### 📋 Requisitos Previos
* Tener instalado **Node.js** (versión 18 o superior). Podés descargarlo gratis desde [nodejs.org](https://nodejs.org/).

---

### 🚀 Pasos para Iniciar el Proyecto

1. **Clonar el repositorio:**  
   Abrí una terminal (PowerShell, Git Bash o la terminal integrada de VS Code) y ejecutá:
   ```bash
   git clone [https://github.com/LautiCubino/MoneyManagementApp.git](https://github.com/LautiCubino/MoneyManagementApp.git)

2. **Ingresar a la carpeta del proyecto:**
   cd MoneyManagementApp

3.**Instalar dependencias:**

El proyecto usa pnpm por defecto, pero podés correrlo con cualquiera de las dos opciones:
   npx pnpm install
(o npm install)

Levantar el entorno local de desarrollo:

Bash
npx pnpm dev
(o npm run dev)

4.**Abrir la app en el navegador:**

La terminal te mostrará el enlace local (usualmente http://localhost:5173 o http://localhost:8443). 
Hacé Ctrl + Clic o abrilo en tu navegador para empezar a probarla.

5.**Detener el servidor:**
Presioná Ctrl + C en la terminal para apagar el entorno local de desarrollo.
