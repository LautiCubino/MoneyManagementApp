# 💸 MoneyManagementApp

Una aplicación web/PWA rápida, sin fricción y pensada para resolver cuentas en el momento. Diseñada específicamente para juntadas, asados y salidas grupales donde se necesita registrar gastos sobre la marcha y conocer de forma transparente cuánto le debe pagar cada participante a quién, ítem por ítem.

---

## 🚀 Características Principales

* **Cero Registro (Guest-First):** No requiere crear cuentas, verificar correos ni iniciar sesión. Creás la juntada en un toque y cargás los participantes al instante.
* **Carga Rápida en Vivo:** Registrá compras a medida que ocurren (comida, bebidas, transporte) indicando quién puso la plata y entre quiénes se divide el consumo.
* **Cálculo Transparente Ítem por Ítem:** División proporcional por producto para evitar confusiones o malentendidos sobre qué está pagando cada persona.
* **Resumen Listo para WhatsApp:** Genera un mensaje formateado con el desglose exacto de transferencias y el alias/CBU de cada acreedor, listo para copiar o compartir directamente al grupo con la Web Share API.
* **Persistencia Local:** Todo se guarda automáticamente en el almacenamiento local del navegador (`localStorage`), evitando la pérdida de datos si se cierra la pestaña o se recarga el dispositivo.
* **Diseño Mobile-First Accesible:** Interfaz oscura y minimalista optimizada para operar con una sola mano en pantallas táctiles.

---

## 🛠️ Tecnologías Utilizadas

* **Framework Base:** [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Diseño y Prototipado:** [Figma](https://www.figma.com/)
* **Iconografía:** [Lucide Icons](https://lucide.dev/)

---

## 📱 Capturas de Pantalla

<img width="291" height="620" alt="image" src="https://github.com/user-attachments/assets/3975bbbd-5c5f-447f-977d-29710464a365" />

<img width="299" height="616" alt="image" src="https://github.com/user-attachments/assets/777a3601-bbe3-44ac-91d5-f3fa98aba156" />

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
