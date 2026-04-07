// ---------- MANEJO DE PESTAÑAS ----------
let tabActual = 0;

window.cambiarTab = function(tab) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-content-${tab}`).classList.remove('hidden');
    
    // Resetear estilos de botones
    document.querySelectorAll('button[id^="btn-tab-"]').forEach(btn => {
        btn.classList.remove('tab-active', 'border-b-3', 'border-gold', 'text-gold');
        btn.classList.add('tab-link');
    });
    
    const btnActivo = document.getElementById(`btn-tab-${tab}`);
    if (btnActivo) {
        btnActivo.classList.remove('tab-link');
        btnActivo.classList.add('tab-active', 'border-b-3', 'border-gold', 'text-gold');
    }
    tabActual = tab;
};

// ---------- CONTADOR DE VISITAS BASADO EN IP CON COUNTAPI ----------
async function cargarContadorVisitas() {
    const counterEl = document.getElementById("visitCounter");
    if (!counterEl) return;

    try {
        // 1. Obtener la IP del visitante usando ipify
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) throw new Error("No se pudo obtener la IP");
        
        const ipData = await ipResponse.json();
        const userIP = ipData.ip;
        
        // 2. Crear una clave única basada en la IP para este sitio
        const storageKey = `visited_luis_eilerys_${userIP.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const today = new Date().toDateString();
        
        // 3. Verificar si esta IP ya visitó el sitio hoy
        const lastVisit = localStorage.getItem(storageKey);
        const isNewVisit = (lastVisit !== today);
        
        // Namespace y key para CountAPI
        const namespace = "luis-eilerys-site";
        const key = "visitas-totales";
        
        let visitas;
        
        if (isNewVisit) {
            // Es una nueva visita hoy: incrementamos el contador global
            localStorage.setItem(storageKey, today);
            
            const response = await fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`);
            if (!response.ok) throw new Error("Error al incrementar contador");
            
            const data = await response.json();
            visitas = data.value;
        } else {
            // Ya visitó hoy: solo leemos el valor actual sin incrementar
            const response = await fetch(`https://api.countapi.xyz/get/${namespace}/${key}`);
            if (!response.ok) throw new Error("Error al leer contador");
            
            const data = await response.json();
            visitas = data.value;
        }
        
        // Mostrar el contador
        counterEl.textContent = visitas.toLocaleString();
        
    } catch (error) {
        console.error("Error en el contador de visitas por IP:", error);
        counterEl.textContent = "---";
    }
}

// ---------- GUESTBOOK CON LOCALSTORAGE ----------
let mensajes = [];

function cargarMensajes() {
    const stored = localStorage.getItem("guestbook_luis_eilerys");
    if (stored) {
        mensajes = JSON.parse(stored);
    } else {
        // Mensajes de ejemplo
        mensajes = [
            { nombre: "Familia Jiménez", mensaje: "Felicidades a los dos, que su amor siga creciendo cada día. ❤️", fecha: "2026-03-20" },
            { nombre: "Amigos de Manzanillo", mensaje: "¡Qué bonita historia! Un abrazo enorme para Luis y Eilerys.", fecha: "2026-03-22" },
            { nombre: "Claudia", mensaje: "Deseo que siempre compartan esa complicidad. ¡Salud y amor!", fecha: "2026-03-23" }
        ];
        localStorage.setItem("guestbook_luis_eilerys", JSON.stringify(mensajes));
    }
    renderMensajes();
}

function renderMensajes() {
    const contenedor = document.getElementById("listaMensajes");
    if (!contenedor) return;
    
    if (mensajes.length === 0) {
        contenedor.innerHTML = '<p class="text-center text-gray-400 text-sm">Aún no hay mensajes. ¡Sé el primero en escribirnos!</p>';
        return;
    }
    
    let html = "";
    // Mostrar más reciente primero
    [...mensajes].reverse().forEach(msg => {
        html += `
            <div class="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fas fa-user-circle text-gold text-xl"></i>
                    <span class="font-semibold text-gray-800">${escapeHtml(msg.nombre)}</span>
                    <span class="text-xs text-gray-400 ml-auto">${msg.fecha || "Reciente"}</span>
                </div>
                <p class="text-gray-600 mt-1">${escapeHtml(msg.mensaje)}</p>
            </div>
        `;
    });
    contenedor.innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function guardarMensaje(nombre, mensaje, email) {
    const fechaActual = new Date().toISOString().slice(0,10);
    mensajes.push({ 
        nombre: nombre.trim(), 
        mensaje: mensaje.trim(), 
        email: email || "", 
        fecha: fechaActual 
    });
    localStorage.setItem("guestbook_luis_eilerys", JSON.stringify(mensajes));
    renderMensajes();
}

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", function() {
    cambiarTab(0);
    cargarMensajes();
    cargarContadorVisitas();
    
    // Formulario de mensajes
    const form = document.getElementById("guestbookForm");
    const confirmDiv = document.getElementById("mensajeConfirmacion");
    
    if (form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
            const nombreInput = document.getElementById("nombre");
            const mensajeInput = document.getElementById("mensaje");
            const emailInput = document.getElementById("email");
            const nombre = nombreInput.value.trim();
            const mensaje = mensajeInput.value.trim();
            const email = emailInput.value;
            
            if (!nombre || !mensaje) {
                alert("Por favor, escribe tu nombre y un mensaje.");
                return;
            }
            
            guardarMensaje(nombre, mensaje, email);
            form.reset();
            confirmDiv.classList.remove("hidden");
            confirmDiv.innerHTML = `<i class="fas fa-check-circle mr-2"></i> ¡Gracias ${escapeHtml(nombre)}! Tu mensaje ha sido guardado con cariño.`;
            setTimeout(() => confirmDiv.classList.add("hidden"), 5000);
        });
    }
});