/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Scissors, Phone, Mail, MapPin, X, ShieldCheck } from 'lucide-react';
import { BARBER_CONTACT } from '../data';

interface FooterProps {
  onScrollTo: (sectionId: string) => void;
}

export default function Footer({ onScrollTo }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const [activeModal, setActiveModal] = useState<'privacidad' | 'legal' | 'cookies' | null>(null);

  return (
    <footer id="main-footer" className="bg-neutral-950 border-t border-neutral-850 pt-16 pb-8 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Col 1: Brand Logotype & foundation info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onScrollTo('inicio')}>
              <div className="p-2 bg-amber-500 rounded text-neutral-950">
                <Scissors className="w-5 h-5 focus:outline-none" />
              </div>
              <span className="font-serif text-lg tracking-widest text-white uppercase font-bold">
                EL BASTRIOUI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              Artesanos de la barbería clásica y moderna en Rubí. Desde nuestro año de apertura en {BARBER_CONTACT.foundedYear}, nos volcamos diariamente para garantizar la excelencia en cada corte de pelo y perfilado de barba.
            </p>
          </div>

          {/* Col 2: In-page navigation */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">Navegar</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button onClick={() => onScrollTo('inicio')} className="hover:text-amber-500 transition-colors">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('servicios')} className="hover:text-amber-500 transition-colors">
                  Servicios y Precios
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('reservar')} className="hover:text-amber-500 transition-colors">
                  Agendar Cita
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('contacto')} className="hover:text-amber-500 transition-colors">
                  Contacto y Cómo llegar
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Contact card footer links */}
          <div className="space-y-3.5">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto Directo</h4>
            <div className="flex items-start space-x-2 text-xs sm:text-sm">
              <MapPin className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{BARBER_CONTACT.address}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <Phone className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <a href={`tel:${BARBER_CONTACT.phone}`} className="hover:text-white transition-colors">
                {BARBER_CONTACT.formattedPhone}
              </a>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <Mail className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <a href={`mailto:${BARBER_CONTACT.email}`} className="hover:text-white transition-colors truncate block max-w-xs">
                {BARBER_CONTACT.email}
              </a>
            </div>
          </div>

        </div>

        {/* Legal and credits stripe */}
        <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-600">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
            <p>© {currentYear} Barbería El Bastrioui. Todos los derechos reservados.</p>
            <div className="flex items-center gap-2.5 text-neutral-500 text-[11px]">
              <button onClick={() => setActiveModal('privacidad')} className="hover:text-amber-500 hover:underline transition-colors cursor-pointer">Privacidad (RGPD)</button>
              <span>•</span>
              <button onClick={() => setActiveModal('legal')} className="hover:text-amber-500 hover:underline transition-colors cursor-pointer">Aviso Legal</button>
              <span>•</span>
              <button onClick={() => setActiveModal('cookies')} className="hover:text-amber-500 hover:underline transition-colors cursor-pointer">Cookies</button>
            </div>
          </div>
          <p className="text-right">Establecido en 2023 por Redouan</p>
        </div>

      </div>

      {/* Interactive Modal for Data Protection and GDPR Legal Requirements */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-serif text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                  {activeModal === 'privacidad' && 'Política de Privacidad (RGPD)'}
                  {activeModal === 'legal' && 'Aviso Legal'}
                  {activeModal === 'cookies' && 'Uso de Cookies'}
                </h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 max-h-[55vh] overflow-y-auto text-xs sm:text-sm text-neutral-300 space-y-4 font-sans leading-relaxed">
              {activeModal === 'privacidad' && (
                <>
                  <p className="font-semibold text-white">1. Responsable del Tratamiento de Datos</p>
                  <p>El responsable del tratamiento de los datos recogidos es <strong>Redouan El Bastrioui</strong>, titular de la Barbería El Bastrioui, con dirección comercial en <strong>Carrer de Lumière, 6, local 5, 08191 Rubí, Barcelona</strong>.</p>
                  
                  <p className="font-semibold text-white">2. Qué Datos se Recopilan y con qué Finalidad</p>
                  <ul className="list-disc pl-5 space-y-1.5 list-inside">
                    <li><strong>Nombre completo:</strong> Para poder identificarte en la agenda de reservas del salón.</li>
                    <li><strong>Teléfono móvil:</strong> Necesario para coordinar tu cita, confirmar la asistencia o avisarte ante imprevistos comerciales.</li>
                    <li><strong>Comentarios opcionales:</strong> Para amoldar el servicio a tus gustos.</li>
                  </ul>
                  
                  <p className="font-semibold text-white">3. Absoluta Seguridad y Privacidad</p>
                  <p>Valoramos la confianza de nuestros vecinos de Rubí. Jamás utilizaremos tus datos para fines promocionales no deseados, no enviamos Spam, y nunca se transferirán o venderán tus datos a ningún tercero.</p>

                  <p className="font-semibold text-white">4. Almacenamiento Local del Historial de Citas</p>
                  <p>Para simplificar tu experiencia y evitar contraseñas difíciles, el navegador almacena de forma interna y local encriptados tus identificadores de reserva ("Mis Reservas"), facilitando que veas tus turnos agendados autónomamente.</p>

                  <p className="font-semibold text-white">5. Tus Derechos Legales (Acceso, Rectificación y Cancelación)</p>
                  <p>En base al Reglamento General de Protección de Datos (RGPD) europeo de España, puedes revocar tu consentimiento, pedir acceso, rectificación o la supresión total e inmediata de tus datos de nuestra base de datos. Para ejercerlo, solicítanoslo físicamente, llámanos a {BARBER_CONTACT.formattedPhone} o contáctanos por email a {BARBER_CONTACT.email} y borraremos tu ficha sin preguntas y de inmediato.</p>
                </>
              )}

              {activeModal === 'legal' && (
                <>
                  <p className="font-semibold text-white">1. Datos Identificativos</p>
                  <p>En cumplimiento de lo dispuesto en la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE):</p>
                  <ul className="list-none space-y-1 pl-1">
                    <li>• <strong>Titular:</strong> Redouan El Bastrioui</li>
                    <li>• <strong>Establecimiento:</strong> Barbería El Bastrioui</li>
                    <li>• <strong>Dirección:</strong> Carrer de Lumière, 6, local 5, 08191 Rubí, Barcelona</li>
                    <li>• <strong>Teléfono:</strong> {BARBER_CONTACT.formattedPhone}</li>
                    <li>• <strong>Email de contacto:</strong> {BARBER_CONTACT.email}</li>
                  </ul>

                  <p className="font-semibold text-white">2. Uso Responsable del Portal</p>
                  <p>Este sitio web facilita la reserva autónoma de citas de barbería. Los usuarios se comprometen a utilizarlo legítimamente. Las citas ficticias o abusivas podrán ser canceladas unilateralmente por el administrador.</p>

                  <p className="font-semibold text-white">3. Propiedad del Contenido</p>
                  <p>Todos los textos, logotipos, estilos y gráficos son de uso comercial autorizado exclusivamente por Barbería El Bastrioui. Se prohíbe su reproducción comercial externa sin consentimiento previo.</p>
                </>
              )}

              {activeModal === 'cookies' && (
                <>
                  <p className="font-semibold text-white">1. Qué Tecnologías de Almacenamiento Usamos</p>
                  <p>Para respetar al máximo tu privacidad, este sitio web no utiliza cookies de marketing de terceros, ni píxeles de seguimiento invasivos, ni perfiles de anuncios.</p>

                  <p className="font-semibold text-white">2. Almacenamiento Técnico Imprescindible (Exento de Aceptación Invasiva)</p>
                  <p>Únicamente se utiliza la memoria de almacenamiento local (LocalStorage) técnica e indispensable para:</p>
                  <ul className="list-disc pl-5 space-y-1 list-inside">
                    <li>Recordarle a este navegador qué citas has agendado tú mismo para que visualices tu panel personal sin requerir passwords.</li>
                    <li>Mantener la seguridad y fluidez del proceso de reserva en línea.</li>
                  </ul>
                  <p>Puedes desactivar este almacenamiento o limpiar la memoria técnica del navegador cuando desees en su configuración habitual.</p>
                </>
              )}
            </div>

            <div className="p-4 bg-neutral-950 border-t border-neutral-800 text-right flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs sm:text-sm font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
              >
                Cerrar y Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
