const translations = {
    en: {
        nav: {
            about: "About",
            expertise: "Profile",
            experience: "Experience",
            academy: "Academy",
            //blog: "Blog",
            article: "Article",
            contact: "Contact",
            resume: "Download CV"
        },
        hero: {
            intro: "Hi, I specialize in",
            title: "Systems Engineering & Information Security.",
            subtitle: "Technology, Risk Management, and Security Operations.",
            desc: "Over 15 years connecting technology infrastructure and data with risk management, operational continuity, and cybersecurity.",
            btnExpertise: "View research",
            btnAbout: "About me",
            btnCvPdf: "Download CV (PDF)"
        },
        about: {
            title: "About Me",
            p1: "I am an IT Engineer and Systems Engineer with more than 15 years of experience, developed mainly in the Peruvian public sector. In these roles, I led IT areas, data interoperability projects, established security standards, implemented access controls and supervised secure technological infrastructures.",
            p2: "Beyond the technical part, I have also dedicated myself to the academic field as a University Professor in IT and Systems Engineering, as well as in Cybersecurity.",
            p3: "My focus is on integrating my experience in secure operations with advancements in emerging technologies, with the goal of bringing the balance of technical expertise and strategy that companies require today."
        },
        expertise: {
            title: "Practice Areas",
            card1: {
                title: "Systems, Interoperability & Data",
                subtitle: "\"Architecture, APIs & Traceability\"",
                items: [
                    "Institutional Interoperability & Secure API Services",
                    "Auditing & SQL Queries on Sensitive Databases",
                    "Technical Leadership for Digital Solutions & Products",
                    "B2B Platform Support & Functional Testing"
                ]
            },
            card2: {
                title: "Governance, Risk & Compliance",
                subtitle: "\"Strategy & Control Frameworks\"",
                items: [
                    "Security Frameworks (ISO 27001, NIST CSF 2.0, CIS Controls)",
                    "Technology Risk Assessment & Mitigation",
                    "Access Control, Privacy & Security Policies",
                    "Cybersecurity Awareness & Technical Training"
                ]
            },
            card3: {
                title: "Incident Management & Cyberdefense",
                subtitle: "\"Response, Forensics & Assessment\"",
                items: [
                    "Cyberattack Mitigation & Containment (MITRE ATT&CK)",
                    "Digital Forensics & Evidence Preservation",
                    "Vulnerability Assessment & Controlled Pentesting",
                    "Endpoint Security Monitoring & Automation"
                ]
            }
        },
        experience: {
            title: "Experience Timeline",
            job1: {
                role: "Postgraduate Professor",
                company: "Universidad César Vallejo",
                date: "Sept 2025 - Present",
                items: [
                    "Teaching 'Cyberattack Mitigation and Containment' using NIST, CIS Controls, and MITRE ATT&CK frameworks.",
                    "Integrating theory and practice through real-world incident analysis and collaborative projects.",
                    "Promoting a strategic vision of organizational resilience and crisis management."
                ]
            },
            job2: {
                role: "IT Project Manager & Cybersecurity Strategy",
                company: "Policía Nacional del Perú",
                date: "Jan 2024 - Oct 2025",
                items: [
                    "Led strategic tech projects to modernize police operations and secure mission-critical information.",
                    "Implemented security policies aligned with ISO 27001 and international standards.",
                    "Managed hybrid teams and budgets, ensuring delivery of high-social-impact systems."
                ]
            },
            job3: {
                role: "Section Chief of Data Interoperability",
                company: "Policía Nacional del Perú",
                date: "Jan 2023 - Dec 2023",
                items: [
                    "Managed the Institutional Interoperability Platform ensuring secure G2G data exchange.",
                    "Defined security standards for API contracts (authentication and encryption).",
                    "Implemented audit trails and access controls for sensitive databases (No Repudiation)."
                ]
            },
            job4: {
                role: "Lead Technical",
                company: "Policía Nacional del Perú",
                date: "Nov 2016 - Dec 2022",
                items: [
                    "Led the development of critical digital products like the National Missing Persons Search System.",
                    "Implemented DevSecOps culture with strict security validations (input sanitization, error handling).",
                    "Acted as main technical liaison between dev teams, infrastructure, and Product Owners."
                ]
            }
        },
        articles: {
            title: "Technical Publications &amp; Research",
            subtitle: "Applied research, threat modeling, and reference architectures.",
            readArticle: "Read Full Article &rarr;",
            viewAll: "View All Publications",
            art1: {
                badge: "Research &amp; PoC",
                title: "Cyber Resilience Architecture for Critical Infrastructure",
                desc: "Reference architecture, multi-criteria evaluation under ISO/IEC 25010, and practical validation: Supply Chain Security (SBOM CycloneDX), risk triage via CISA SSVC + EPSS, and active detection with Coraza WAF + Wazuh SIEM.",
                readTime: "12 min read"
            }
        },
        tech: {
            title: "Technical Arsenal"
        },
        leadMagnet: {
            title: "Ready to Elevate Your Professional Profile?",
            desc: "Access practical, specialized training in Cybersecurity and Tech. Get certified and stand out in the job market.",
            btn: "View All Courses"
        },
        academy: {
            title: "Cyber Academy",
            subtitle: "Executive & Technical Training for the Modern Era.",
            card1: {
                title: "SQL for Auditors",
                desc: "Master data queries to detect anomalies and validate integrity without relying on tools.",
                badge: "Technical"
            },
            card2: {
                title: "Cybersecurity Governance",
                desc: "Align IT operations with business strategy and compliance frameworks.",
                badge: "Management"
            },
            card3: {
                title: "Threat Hunting 101",
                desc: "Proactive search for cyber threats that evade existing security solutions.",
                badge: "Operations"
            },
            card4: {
                title: "Python Course from Scratch",
                desc: "Learn Python with a focus on cybersecurity, DevSecOps, and data validation.",
                badge: "Development"
            },
            btnStart: "Start Learning",
            btnSoon: "Coming Soon"
        },

        contact: {
            title: "Let's connect.",
            desc: "Open to new professional challenges, technical consulting, and projects in information security, incident management, and IT operations.",
            btnContact: "Contact Me"
        },
        footer: {
            rights: "© 2026 Rafael Pérez Llorca. All rights reserved.",
            privacy: "Privacy Policy",
            legal: "Legal Notice"
        },
        privacyPage: {
            title: "Privacy Policy",
            section1: {
                title: "1. DATA CONTROLLER",
                text: "Personal data provided voluntarily via direct email communication will be processed by Rafael Antonio Pérez Llorca, based in Madrid, Spain. Contact: leafar_8710@hotmail.com."
            },
            section2: {
                title: "2. COLLECTED DATA AND PURPOSE",
                intro: "This website has been engineered under the principle of Data Minimization (Privacy by Design):",
                item1: "<strong>No Data Capture Forms:</strong> There are no user databases or capture forms on the web server. Contact is made directly and voluntarily via mailto links or LinkedIn.",
                item2: "<strong>No Tracking Cookies:</strong> No invasive analytical cookies or third-party advertising tracking tools are used.",
                item3: "<strong>Technical Local Storage:</strong> Only browser local storage (localStorage) is used to remember visual theme preferences (light/dark). This data is purely technical and resides exclusively on your device."
            },
            section3: {
                title: "3. LEGAL BASIS",
                text: "The legal basis for processing data provided voluntarily in direct communication is legitimate interest and the consent of the sender to attend to professional or technical collaboration inquiries."
            },
            section4: {
                title: "4. RECIPIENTS AND TRANSFERS",
                text: "Data will not be transferred to third parties nor to third countries except in compliance with express legal obligations."
            },
            section5: {
                title: "5. YOUR RIGHTS",
                text: "You have the right to access, rectify, erase, and oppose the processing of your data under the GDPR by sending an email to leafar_8710@hotmail.com."
            }
        },
        legalPage: {
            title: "Legal Notice",
            section1: {
                title: "1. WEBSITE OWNER",
                intro: "In compliance with the duty of information set forth in Article 10 of Law 34/2002, of July 11, on Information Society Services and Electronic Commerce, the following is stated:",
                owner: "Owner:",
                address: "Address:",
                email: "Contact Email:",
                activity: "Activity:",
                activityValue: "Professional dissemination, technological research, and academic training in Systems Engineering and Cybersecurity."
            },
            section2: {
                title: "2. PURPOSE",
                text: "This website is a professional portfolio, research repository, and technical dissemination portal. Its purpose is to share engineering, cybersecurity, and specialized training projects."
            },
            section3: {
                title: "3. INTELLECTUAL PROPERTY",
                text: "All website contents (technical articles, proof of concepts, source code, and design) are owned by Rafael Antonio Pérez Llorca or hold appropriate usage licenses. Unauthorized reproduction or commercialization is prohibited."
            }
        }
    },
    es: {
        nav: {
            about: "Sobre Mí",
            expertise: "Perfil",
            experience: "Experiencia",
            academy: "Academia",
            //blog: "Blog",
            article: "Artículo",
            contact: "Contacto",
            resume: "Descargar CV"
        },
        hero: {
            intro: "Hola, me especializo en",
            title: "Ingeniería de Sistemas & Seguridad de la Información.",
            subtitle: "Tecnología, Gestión de Riesgos y Operaciones de Seguridad.",
            desc: "Más de 15 años conectando la infraestructura tecnológica y los datos con la gestión del riesgo, la continuidad operativa y la ciberseguridad.",
            btnExpertise: "Ver investigación",
            btnAbout: "Sobre mí",
            btnCvPdf: "Descargar CV (PDF)",
            credYears: "Madrid, España"
        },
        about: {
            title: "Sobre Mí",
            p1: "Soy Ingeniero Informático y de Sistemas con más de 15 años de trayectoria en soporte TI, desarrollo, interoperabilidad, gestión de datos, dirección de proyectos y ciberseguridad. Desarrollé buena parte de mi carrera en la Policía Nacional del Perú, participando en proyectos tecnológicos de alcance nacional con sistemas e información sensible.",
            p2: "Actualmente en España trabajo en Palco Ticketing (plataforma B2B para eventos), combinando soporte de producto con iniciativas de monitorización de endpoints, automatización y seguridad de la información. Paralelamente, soy Docente de Posgrado en la Universidad César Vallejo en mitigación de ciberataques, informática forense y pentesting.",
            p3: "Mi objetivo es aportar en proyectos donde convergen la ingeniería de sistemas, la seguridad de la información y el gobierno tecnológico: entender qué ocurre en los sistemas, identificar el riesgo y transformarlo en acciones y controles operativos concretos."
        },
        expertise: {
            title: "Áreas de Práctica",
            card1: {
                title: "Sistemas, Interoperabilidad & Datos",
                subtitle: "\"Arquitectura, APIs y Trazabilidad\"",
                items: [
                    "Interoperabilidad Institucional y Servicios API Seguros",
                    "Auditoría y Consultas SQL en Bases de Datos Sensibles",
                    "Dirección Técnica de Soluciones y Productos Digitales",
                    "Soporte de Plataformas B2B y Pruebas Funcionales"
                ]
            },
            card2: {
                title: "Gobernanza, Riesgo & Cumplimiento",
                subtitle: "\"Estrategia y Marcos de Control\"",
                items: [
                    "Marcos de Referencia (ISO 27001, NIST CSF 2.0, CIS Controls)",
                    "Evaluación y Gestión de Riesgos Tecnológicos",
                    "Políticas de Seguridad, Control de Accesos y Privacidad",
                    "Concienciación en Ciberseguridad y Formación Técnica"
                ]
            },
            card3: {
                title: "Gestión de Incidentes & Ciberdefensa",
                subtitle: "\"Respuesta, Forense y Evaluación\"",
                items: [
                    "Mitigación y Contención de Ciberataques (MITRE ATT&CK)",
                    "Informática Forense y Preservación de Evidencias Digitales",
                    "Evaluación de Vulnerabilidades y Pentesting",
                    "Monitorización de Seguridad en Endpoints y Automatización"
                ]
            }
        },
        experience: {
            title: "Cronología de Experiencia",
            job1: {
                role: "Ingeniero de Soporte & Ciberseguridad",
                company: "Palco Ticketing",
                date: "Feb 2026 — Actualidad",
                items: [
                    "Atención y análisis de incidencias sobre plataforma B2B de ticketing para eventos y ejecución de pruebas funcionales.",
                    "Despliegue y desarrollo de scripts para automatizar la instalación y configuración de agentes de monitorización de seguridad en endpoints.",
                    "Colaboración en iniciativas de concienciación en ciberseguridad (anti-phishing) y adecuación a controles de seguridad de la información."
                ]
            },
            job2: {
                role: "Docente de Posgrado en Ciberseguridad",
                company: "Universidad César Vallejo",
                date: "Sept 2025 — Actualidad",
                items: [
                    "Cátedra de Mitigación y Contención de Ciberataques: ciclo de respuesta a incidentes bajo marcos NIST CSF, CIS Controls y MITRE ATT&CK.",
                    "Cátedra de Ingeniería Forense: fundamentos de investigación digital, preservación y trazabilidad de evidencias en incidentes.",
                    "Cátedra de Pentesting: fases de evaluación de seguridad, identificación de vulnerabilidades, explotación controlada y hallazgos."
                ]
            },
            job3: {
                role: "Jefe de Proyectos TIC & Estrategia de Ciberseguridad",
                company: "Policía Nacional del Perú",
                date: "Ene 2024 — Oct 2025",
                items: [
                    "Planificación y dirección de proyectos tecnológicos nacionales: Gestión Documental, SERPOL, Mi Policía Digital y Búsqueda de Personas.",
                    "Integración de requisitos de seguridad desde el diseño, control de accesos y privacidad de datos alineados con ISO 27001.",
                    "Evaluación de riesgos tecnológicos y supervisión técnica de despliegues críticos ante autoridades y entes rectores."
                ]
            },
            job4: {
                role: "Líder de Interoperabilidad & Jefe Técnico",
                company: "Policía Nacional del Perú",
                date: "Nov 2016 — Dic 2023",
                items: [
                    "Operación de la Plataforma de Interoperabilidad Institucional, servicios de intercambio seguro de datos e integraciones vía API con autenticación y cifrado.",
                    "Liderazgo del equipo técnico en el desarrollo y puesta en producción del Sistema Nacional de Búsqueda de Personas Desaparecidas y Denuncia Virtual.",
                    "Ejecución de consultas SQL de alta sensibilidad, verificación de consistencia e implementación de auditoría de accesos."
                ]
            }
        },
        articles: {
            title: "Publicaciones",
            subtitle: "Investigación aplicada, modelado de amenazas y arquitecturas de referencia.",
            readArticle: "Leer Artículo Completo",
            viewAll: "Ver Todas las Publicaciones",
            art1: {
                badge: "Investigación y PoC",
                title: "Arquitectura de Ciberresiliencia para Infraestructuras Críticas",
                desc: "Arquitectura de referencia, evaluación multicriterio bajo ISO/IEC 25010 y validación práctica: seguridad en cadena de suministro (SBOM CycloneDX), triaje de riesgo con CISA SSVC + EPSS y detección activa con Coraza WAF + Wazuh SIEM.",
                readTime: "12 min de lectura"
            }
        },
        tech: {
            title: "Arsenal Técnico"
        },
        leadMagnet: {
            title: "¿Listo para potenciar tu perfil profesional?",
            desc: "Accede a formación práctica y especializada en Ciberseguridad y Tecnología. Certifícate y destaca en el mercado laboral.",
            btn: "Ver Todos los Cursos"
        },
        academy: {
            title: "Ciber Academia",
            subtitle: "Formación Ejecutiva y Técnica para la Era Moderna.",
            card1: {
                title: "SQL para Auditores",
                desc: "Domina las consultas de datos para detectar anomalías y validar integridad sin depender de herramientas.",
                badge: "Técnico"
            },
            card2: {
                title: "Gobernanza de Ciberseguridad",
                desc: "Alinea las operaciones de TI con la estrategia empresarial y marcos de cumplimiento (ISO, ENS).",
                badge: "Gestión"
            },
            card3: {
                title: "Threat Hunting 101",
                desc: "Búsqueda proactiva de ciberamenazas que evaden las soluciones de seguridad existentes.",
                badge: "Operaciones"
            },
            card4: {
                title: "Curso Python desde 0",
                desc: "Aprende Python con enfoque en ciberseguridad, DevSecOps y validación de datos.",
                badge: "Desarrollo"
            },
            btnStart: "Empezar a Aprender",
            btnSoon: "Próximamente"
        },

        contact: {
            title: "¿Hablamos?",
            desc: "Abierto a nuevos retos profesionales, consultoría técnica y proyectos en seguridad de la información, gestión de incidentes y operaciones TI.",
            btnContact: "Contáctame"
        },
        footer: {
            rights: "© 2026 Rafael Pérez Llorca. Todos los derechos reservados.",
            privacy: "Política de Privacidad",
            legal: "Aviso Legal"
        },
        privacyPage: {
            title: "Política de Privacidad",
            section1: {
                title: "1. RESPONSABLE DEL TRATAMIENTO",
                text: "Los datos personales facilitados mediante comunicación voluntaria por correo electrónico serán tratados por Rafael Antonio Pérez Llorca, con domicilio profesional en Madrid, España. Contacto: leafar_8710@hotmail.com."
            },
            section2: {
                title: "2. DATOS RECOGIDOS Y FINALIDAD",
                intro: "Este sitio web ha sido diseñado bajo el principio de <strong>Minimización de Datos</strong> (Privacy by Design):",
                item1: "<strong>Sin Formularios de Captura:</strong> No existen formularios ni bases de datos de usuarios en el servidor web. El contacto se realiza de forma directa y voluntaria a través de enlaces mailto o mediante LinkedIn.",
                item2: "<strong>Sin Cookies de Rastreo:</strong> No se utilizan cookies analíticas invasivas ni herramientas de seguimiento publicitario de terceros.",
                item3: "<strong>Preferencia Local Técnica:</strong> Se utiliza únicamente el almacenamiento local del navegador (localStorage) para recordar la preferencia de tema visual (claro u oscuro). Este dato es puramente técnico y reside de manera exclusiva en su navegador."
            },
            section3: {
                title: "3. BASE LEGAL",
                text: "La base legal para el tratamiento de los datos aportados voluntariamente en una comunicación directa es el interés legítimo y el consentimiento del emisor para atender consultas profesionales o de colaboración técnica."
            },
            section4: {
                title: "4. DESTINATARIOS Y CESIÓN",
                text: "Los datos no se cederán a terceros ni se transferirán a terceros países salvo en cumplimiento de obligaciones legales expresas."
            },
            section5: {
                title: "5. EJERCICIO DE DERECHOS",
                text: "Puede ejercer sus derechos de acceso, rectificación, supresión y oposición reconocidos en el RGPD enviando un mensaje a leafar_8710@hotmail.com."
            }
        },
        legalPage: {
            title: "Aviso Legal",
            section1: {
                title: "1. TITULAR DE LA WEB",
                intro: "En cumplimiento del deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico, se indica:",
                owner: "Titular:",
                address: "Domicilio:",
                email: "Email de contacto:",
                activity: "Actividad:",
                activityValue: "Divulgación profesional, investigación tecnológica y formación académica en Ingeniería de Sistemas y Ciberseguridad."
            },
            section2: {
                title: "2. OBJETO",
                text: "El presente sitio web tiene carácter de portafolio profesional, repositorio de investigación y portal de divulgación técnica. Su objetivo es difundir proyectos en ingeniería de sistemas, ciberseguridad y docencia especializada."
            },
            section3: {
                title: "3. PROPIEDAD INTELECTUAL",
                text: "Todos los contenidos del sitio web (artículos técnicos, pruebas de concepto, código fuente y diseño) son titularidad de Rafael Antonio Pérez Llorca o cuentan con licencias de uso correspondientes. Queda prohibida la reproducción o comercialización no autorizada."
            }
        }
    }
};
