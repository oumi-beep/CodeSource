import { BarChart2, ClipboardList, Code, Database, LineChart, Network, Server, ShieldCheck, Zap } from "lucide-react"

// Types pour les données des filières
export interface PointFort {
  text: string
}

export interface Debouche {
  text: string
}

export interface Cours {
  titre: string
  description: string
}

export interface Competence {
  titre: string
  description: string
  icon: any // Composant icône Lucide
}

export interface CategorieDebouche {
  categorie: string
  postes: string[]
}

export interface FiliereData {
  description: string
  pointsForts: PointFort[]
  debouches: Debouche[]
  cours: Cours[]
  competences: Competence[]
  categoriesDebouches: CategorieDebouche[]
}

// Données pour chaque filière
export const filieresData: Record<string, FiliereData> = {
  "GI": {
    description:
      "La filière Génie Informatique forme des ingénieurs spécialisés en génie logiciel, avec des compétences en bases de données, programmation avancée, ingénierie logicielle, sécurité, DevOps, cloud computing et développement web et mobile. La formation s’appuie sur de solides bases en mathématiques, statistiques et analyse de données pour résoudre des problèmes techniques et gérer des infrastructures évolutives et sécurisées.",
    pointsForts: [
      { text: "Excellentes performances en mathématiques et informatique" },
      { text: "Fort intérêt pour la programmation et le développement logiciel" },
      { text: "Bon niveau en analyse de données et intelligence artificielle" },
    ],
    debouches: [
      { text: "Développeur Full Stack" },
      { text: "Ingénieur DevOps" },
      { text: "Ingénieur concepteur des logiciels" },
      { text: "Administrateur de Bases de Données " },
      { text: "Responsable de la Sécurité des Systèmes d'Information" },
      { text: "Ingénieur Test et Validation " },
    ],
    cours: [
      { titre: "Algorithmes et structures de données", description: "Conception et analyse d'algorithmes efficaces" },
      { titre: "Bases de données avancées", description: "Conception, optimisation et administration" },
      { titre: "Intelligence artificielle", description: "Apprentissage automatique et traitement du langage naturel" },
      { titre: "Développement web et mobile", description: "Frameworks modernes et architectures responsive" },
      { titre: "Virtualisation, Cloud et Sécurité", description: "Technologies de virtualisation et services cloud" },
    ],
    competences: [
      {
        titre: "Développement logiciel",
        description:
          "Maîtrise des langages de programmation (Java, Python, C++), conception orientée objet, et développement d'applications.",
        icon: Code,
      },
      {
        titre: "Gestion de données",
        description: "Conception et optimisation de bases de données, analyse de données et systèmes d'information.",
        icon: Database,
      },
      {
        titre: "Réseaux et systèmes",
        description: "Administration de systèmes, configuration de réseaux, virtualisation et cloud computing.",
        icon: Network,
      },
      {
        titre: "Intelligence artificielle",
        description:
          "Apprentissage automatique, traitement du langage naturel, vision par ordinateur et systèmes experts.",
        icon: LineChart,
      },
    ],
    categoriesDebouches: [
      {
        categorie: "Développement",
        postes: ["Développeur Full Stack", "Ingénieur logiciel", "Architecte logiciel", "Développeur mobile"],
      },
      {
        categorie: "Infrastructure",
        postes: ["Ingénieur DevOps", "Administrateur système", "Expert en cybersécurité", "Architecte cloud"],
      },
    ],
  },
  "IRIC": {
    description:
      "Le Cycle Ingénieur en Réseaux Intelligents et Cybersécurité (IRIC), réparti sur six semestres, forme des ingénieurs polyvalents maîtrisant à la fois les aspects techniques avancés et les compétences managériales. Deux parcours sont proposés : cybersécurité et Internet des Objets. Les diplômés peuvent intégrer divers secteurs comme le consulting, la cybersécurité, les banques, les assurances, les opérateurs téléphoniques, les SS2I, l'industrie, et bien d’autres.",
    pointsForts: [
      { text: "Excellentes compétences en configuration et administration réseau" },
      { text: "Fort intérêt pour la cybersécurité et la protection des données" },
      { text: "Bonnes connaissances en systèmes d'exploitation et virtualisation" },
    ],
    debouches: [
      { text: "Ingénieur sécurité des systèmes d’information et Cybersécurité" },
      { text: "Ingénieurs/Consultants réseaux et cloud" },
      { text: "Ingénieurs DevSecOps" },
      { text: "Analystes Forensics et cybercriminalité" },
      { text: "Analyste SOC (Security Operations Center)" },
      { text: "Ingénieurs/Consultants IoT" },
      { text: "Testeurs d’Intrusions (Pentester)" },

    ],
    cours: [
      { titre: "Réseaux informatiques avancés", description: "Protocoles, routage et commutation" },
      { titre: "Sécurité des systèmes et réseaux", description: "Cryptographie, pare-feu et détection d'intrusion" },
      { titre: "Administration système", description: "Linux, Windows Server et services réseau" },
      { titre: "Virtualisation et cloud computing", description: "Technologies de virtualisation et services cloud" },
      { titre: "Réseaux sans fil et mobiles", description: "Technologies 5G, WiFi et IoT" },
    ],
    competences: [
      {
        titre: "Administration réseau",
        description: "Configuration des équipements réseau, routage, commutation et dépannage.",
        icon: Network,
      },
      {
        titre: "Cybersécurité",
        description: "Protection des systèmes, analyse de vulnérabilités et réponse aux incidents.",
        icon: Server,
      },
      {
        titre: "Systèmes d'exploitation",
        description: "Administration Linux et Windows, virtualisation et conteneurisation.",
        icon: Server,
      },
      {
        titre: "Cloud computing",
        description: "Déploiement et gestion d'infrastructures cloud, services AWS, Azure et GCP.",
        icon: Database,
      },
    ],
    categoriesDebouches: [
      {
        categorie: "Réseaux",
        postes: ["Administrateur réseau", "Ingénieur réseau", "Architecte réseau", "Spécialiste en télécommunications"],
      },
      {
        categorie: "Sécurité",
        postes: ["Ingénieur sécurité", "Pentesteur", "Analyste SOC", "Consultant en cybersécurité"],
      },
      {
        categorie: "Infrastructure",
        postes: ["Administrateur système", "Ingénieur cloud", "Architecte infrastructure", "Ingénieur DevOps"],
      },
    ],
  },
  "IID": {
    description:
      "La science des données se place actuellement dans une perspective pluridisciplinaire associant les domaines industriels, des sciences de vie, des sciences des données, des statistiques et de l’informatique. La science des données est une nouvelle discipline qui s’appuie sur la modélisation mathématique, les statistiques, l’informatique et la visualisation. La formation a pour objectif la transformation de grandes masses de données en connaissances pertinentes.",
    pointsForts: [
      { text: "Excellentes compétences en mathématiques et statistiques" },
      { text: "Fort intérêt pour l'analyse de données et l'intelligence artificielle" },
      { text: "Bonnes connaissances en programmation et bases de données" },
    ],
    debouches: [
      { text: "Data Scientist" },
      { text: "Ingénieur Big Data" },
      { text: "Analyste Business Intelligence" },
      { text: "Ingénieur Machine Learning" },
      { text: "Administrateur base de données, administrateur système " },
    ],
    cours: [
      { titre: "Statistiques avancées", description: "Probabilités, inférence statistique et modélisation" },
      { titre: "Machine Learning", description: "Algorithmes supervisés et non supervisés" },
      { titre: "Big Data", description: "Technologies Hadoop, Spark et traitement distribué" },
      { titre: "Data Visualization", description: "Techniques et outils de visualisation de données" },
      { titre: "Deep Learning", description: "Réseaux de neurones et applications" },
    ],
    competences: [
      {
        titre: "Analyse de données",
        description: "Techniques statistiques, préparation et nettoyage de données, interprétation des résultats.",
        icon: LineChart,
      },
      {
        titre: "Intelligence artificielle",
        description: "Algorithmes de machine learning, deep learning et traitement du langage naturel.",
        icon: Zap,
      },
      {
        titre: "Big Data",
        description: "Technologies de traitement distribué, bases de données NoSQL et data lakes.",
        icon: Database,
      },
      {
        titre: "Business Intelligence",
        description: "Tableaux de bord, KPIs et aide à la décision basée sur les données.",
        icon: LineChart,
      },
    ],
    categoriesDebouches: [
      {
        categorie: "Data Science",
        postes: ["Data Scientist", "Ingénieur Machine Learning", "Spécialiste NLP", "Chercheur en IA"],
      },
      {
        categorie: "Big Data",
        postes: ["Ingénieur Big Data", "Architecte de données", "Ingénieur ETL", "Administrateur de bases de données"],
      },
      {
        categorie: "Business Intelligence",
        postes: ["Analyste BI", "Data Analyst", "Consultant en analytique", "Chef de projet BI"],
      },
    ],
  },
  "GE": {
    description:
      "La filière Génie Electrique (GE) forme des ingénieurs de haut niveau possédant les connaissances techniques et méthodologiques permettant de conduire et d'améliorer les performances des unités industrielles, de concevoir et de piloter des systèmes complexes liée à l’industrie et orientées vers la microélectronique, la compatibilité électromagnétique, les systèmes embarqués, l’automatique, la régulation, l’automobile, les énergies renouvelable, la mobilité électrique, l’électrotechnique, l’électronique de puissance, l’intelligence artificielle.",
    pointsForts: [
      { text: "Excellentes compétences en électronique et circuits électriques" },
      { text: "Fort intérêt pour les systèmes embarqués et l'automatisation" },
      { text: "Bonnes connaissances en électrotechnique et énergies renouvelables" },
    ],
    debouches: [
      { text: "Le développement des systèmes embarqués " },
      { text: "L’industrie automobile et aéronautique " },
      { text: "La maintenance industrielle ; Bureaux d’étude" },
      { text: "Les énergies renouvelables" },
      {text:"La mobilité électrique"}
    ],
    cours: [
      { titre: "Électronique de puissance", description: "Convertisseurs et commande de moteurs" },
      { titre: "Systèmes embarqués", description: "Microcontrôleurs et programmation bas niveau" },
      { titre: "Automatique", description: "Contrôle de systèmes et régulation" },
      { titre: "Énergies renouvelables", description: "Systèmes photovoltaïques et éoliens" },
      { titre: "Électrotechnique", description: "Machines électriques et réseaux électriques" },
    ],
    competences: [
      {
        titre: "Conception électronique",
        description: "Conception de circuits, PCB et systèmes électroniques intégrés.",
        icon: Zap,
      },
      {
        titre: "Systèmes embarqués",
        description: "Programmation de microcontrôleurs, FPGA et systèmes temps réel.",
        icon: Server,
      },
      {
        titre: "Automatisation",
        description: "Contrôle de processus, automates programmables et SCADA.",
        icon: Network,
      },
      {
        titre: "Énergies renouvelables",
        description: "Conception et gestion de systèmes d'énergie renouvelable et smart grids.",
        icon: Zap,
      },
    ],
    categoriesDebouches: [
      {
        categorie: "Électronique",
        postes: [
          "Ingénieur en électronique",
          "Concepteur de circuits",
          "Ingénieur test et validation",
          "Ingénieur R&D",
        ],
      },
      {
        categorie: "Systèmes embarqués",
        postes: ["Ingénieur systèmes embarqués", "Développeur firmware", "Ingénieur IoT", "Concepteur FPGA"],
      },
      {
        categorie: "Énergie",
        postes: [
          "Ingénieur en énergie",
          "Spécialiste en énergies renouvelables",
          "Ingénieur réseau électrique",
          "Consultant en efficacité énergétique",
        ],
      },
    ],
  },
  "GPEE": {
  description:
    "La filière Génie des Procédés, de l'Énergie et de l'Environnement (GPEE) forme des ingénieurs capables de concevoir, optimiser et gérer des systèmes industriels complexes, en intégrant les enjeux énergétiques et environnementaux dans les processus industriels.",
  pointsForts: [
    { text: "Excellente maîtrise des procédés de transformation et de la gestion énergétique" },
    { text: "Compétences en modélisation, simulation et optimisation de systèmes industriels" },
    { text: "Expertise en dépollution, énergies renouvelables et efficacité énergétique" },
  ],
  debouches: [
    { text: "Ingénieur procédés" },
    { text: "Ingénieur énergie et environnement" },
    { text: "Consultant en optimisation énergétique" },
    { text: "Chef de projet en industries chimiques ou agroalimentaires" },
  ],
  cours: [
    { titre: "Génie des procédés", description: "Conception, modélisation et optimisation des procédés industriels" },
    { titre: "Énergies renouvelables", description: "Systèmes énergétiques durables et intégration dans l'industrie" },
    { titre: "Dépollution industrielle", description: "Techniques de traitement des effluents et gestion des déchets" },
    { titre: "Mécanique des fluides appliquée", description: "Comportement des fluides dans les systèmes industriels" },
    { titre: "Thermodynamique appliquée", description: "Échanges thermiques et bilans énergétiques des procédés" },
  ],
  competences: [
    {
      titre: "Conception de procédés",
      description: "Développement de procédés industriels performants et respectueux de l'environnement.",
      icon: Server,
    },
    {
      titre: "Optimisation énergétique",
      description: "Amélioration de l'efficacité énergétique des systèmes et intégration des énergies renouvelables.",
      icon: LineChart,
    },
    {
      titre: "Gestion environnementale",
      description: "Maîtrise des techniques de dépollution, de traitement de l'eau et de gestion des déchets.",
      icon: Network,
    },
    {
      titre: "Modélisation et simulation",
      description: "Utilisation d'outils numériques pour simuler et optimiser les procédés industriels.",
      icon: Database,
    },
  ],
  categoriesDebouches: [
    {
      categorie: "Industrie",
      postes: [
        "Ingénieur procédés",
        "Ingénieur production",
        "Responsable optimisation énergétique",
        "Chef de projet industriel",
      ],
    },
    {
      categorie: "Environnement",
      postes: [
        "Ingénieur en dépollution",
        "Consultant environnemental",
        "Responsable QHSE (Qualité, Hygiène, Sécurité, Environnement)",
        "Chef de projet en traitement des eaux",
      ],
    },
    {
      categorie: "Énergie",
      postes: [
        "Ingénieur en énergies renouvelables",
        "Consultant en efficacité énergétique",
        "Responsable d'exploitation énergétique",
        "Chef de projet en transition énergétique",
      ],
    },
  ],
},

  "MGSI": {
  description:
    "La filière Management et Gouvernance des Systèmes d'Information forme des ingénieurs ayant une double compétence en informatique et en management. Elle prépare des professionnels capables de piloter la transformation digitale des organisations et de concevoir des systèmes d'information stratégiques alignés sur les objectifs de l'entreprise.",
  pointsForts: [
    { text: "Double compétence technique et managériale" },
    { text: "Formation axée sur la transformation digitale et l'innovation" },
    { text: "Capacité à piloter des projets SI à forte valeur ajoutée" },
  ],
  debouches: [
    { text: "Ingénieur systèmes d'information" },
    { text: "Chef de projet digital" },
    { text: "Consultant ERP" },
    { text: "Business Analyst" },
    { text: "Ingénieur en gestion de bases de données" },
  ],
  cours: [
    { titre: "Conception des SI", description: "Architecture, modélisation et stratégie des systèmes d'information" },
    { titre: "Management de projets informatiques", description: "Techniques de gestion de projet adaptées aux SI" },
    { titre: "Audit et Sécurité des SI", description: "Protection, conformité et gouvernance des systèmes d'information" },
    { titre: "DevOps et Cloud Computing", description: "Mise en œuvre d'infrastructures cloud et intégration continue" },
    { titre: "Transformation digitale", description: "Stratégies d'innovation et digitalisation des processus métiers" },
  ],
  competences: [
    {
      titre: "Gouvernance des SI",
      description: "Mise en place de stratégies et de structures de gouvernance des systèmes d'information.",
      icon: ShieldCheck,
    },
    {
      titre: "Gestion de projet digital",
      description: "Pilotage de projets informatiques selon des méthodes classiques et agiles.",
      icon: ClipboardList,
    },
    {
      titre: "Développement et intégration SI",
      description: "Conception, développement et intégration de solutions logicielles adaptées aux besoins métiers.",
      icon: Code,
    },
    {
      titre: "Data management et Business Intelligence",
      description: "Analyse des données et exploitation des systèmes d'aide à la décision.",
      icon: BarChart2,
    },
  ],
  categoriesDebouches: [
    {
      categorie: "Management SI",
      postes: ["Chef de projet digital", "Consultant transformation digitale", "Responsable SI"],
    },
    {
      categorie: "Développement et intégration",
      postes: ["Ingénieur développement logiciel", "Ingénieur intégrateur ERP", "Ingénieur base de données"],
    },
    {
      categorie: "Analyse et conseil",
      postes: ["Business Analyst", "Consultant ERP", "Assistant à la Maîtrise d'Ouvrage (AMOA)"],
    },
  ],
},
}

// Fonction pour obtenir les données d'une filière ou retourner une filière par défaut
export function getFiliereData(filiere: string | undefined): FiliereData {
  if (!filiere || !filieresData[filiere]) {
    return filieresData["Génie Informatique"] // Filière par défaut
  }
  return filieresData[filiere]
}
