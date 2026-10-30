/**
 * CampusConnect - Preset Datasets
 * Realistic collegiate networks featuring students, majors, dorms, clubs, and social posts
 */

export const PRESET_DATASETS = {
  // Preset 1: Standard Balanced Collegiate Network (28 students)
  defaultCampus: {
    name: "Apex University of Tech & Design (Default)",
    description: "Diverse academic graph with CS, Design, Robotics, BioMed, and Business students across 5 dorms and 6 student clubs.",
    students: [
      {
        id: "alex_chen",
        name: "Alex Chen",
        major: "Computer Science",
        year: "Junior (3rd Year)",
        dorm: "Turing House",
        clubs: ["Hackathon Club", "ACM Chapter", "AI Society"],
        skills: ["React/Node", "PyTorch/ML", "Algorithms"],
        bio: "Hackathon lead & full-stack builder looking for UI/UX designers and hardware devs.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=alex_chen"
      },
      {
        id: "maya_lin",
        name: "Maya Lin",
        major: "Design & HCI",
        year: "Sophomore (2nd Year)",
        dorm: "Turing House",
        clubs: ["Design Guild", "Hackathon Club"],
        skills: ["Figma/UI", "Design Systems", "Prototyping"],
        bio: "HCI researcher passionate about accessibility, generative UI, and campus social spaces.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=maya_lin"
      },
      {
        id: "marcus_vance",
        name: "Marcus Vance",
        major: "Robotics & Mech",
        year: "Senior (4th Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hardware Lab"],
        skills: ["Embedded C/IoT", "CAD/3D", "ROS"],
        bio: "Formula Student chassis lead. Building autonomous electric rovers.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=marcus_vance"
      },
      {
        id: "priya_patel",
        name: "Priya Patel",
        major: "Computer Science",
        year: "Freshman (1st Year)",
        dorm: "Curie Quad",
        clubs: ["ACM Chapter", "Music & Arts"],
        skills: ["Python", "C++", "Violin"],
        bio: "Freshman navigating CS fundamentals and looking for study groups in Turing House.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=priya_patel"
      },
      {
        id: "david_kim",
        name: "David Kim",
        major: "Electrical & IoT",
        year: "Junior (3rd Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hackathon Club"],
        skills: ["PCB Design", "Microcontrollers", "Firmware"],
        bio: "Hardware enthusiast bridging sensor meshes and cloud dashboards.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=david_kim"
      },
      {
        id: "sophia_rodriguez",
        name: "Sophia Rodriguez",
        major: "Biomedical Eng",
        year: "Senior (4th Year)",
        dorm: "Curie Quad",
        clubs: ["AI Society", "BioTech Alliance"],
        skills: ["Bioinformatics", "Python", "Data Analysis"],
        bio: "Working on neural prosthetics signal processing and bio-sensors.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=sophia_rodriguez"
      },
      {
        id: "ethan_wright",
        name: "Ethan Wright",
        major: "Business & Fin",
        year: "Junior (3rd Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator", "Design Guild"],
        skills: ["Financial Modeling", "Pitch Decks", "Product Strategy"],
        bio: "Incubator liaison connecting student tech projects with seed grants.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ethan_wright"
      },
      {
        id: "chloe_dupont",
        name: "Chloe Dupont",
        major: "Design & HCI",
        year: "Senior (4th Year)",
        dorm: "Euler Tower",
        clubs: ["Design Guild", "Music & Arts"],
        skills: ["3D Animation", "Figma/UI", "Brand Strategy"],
        bio: "Motion designer & synthesizers enthusiast. Designing the campus art gala.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=chloe_dupont"
      },
      {
        id: "zack_taylor",
        name: "Zack Taylor",
        major: "Electrical & IoT",
        year: "Freshman (1st Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hardware Lab"],
        skills: ["Arduino", "Soldering", "Circuit Sim"],
        bio: "Freshman eager to join the Formula SAE electrical sub-team.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=zack_taylor"
      },
      {
        id: "aisha_khan",
        name: "Aisha Khan",
        major: "Computer Science",
        year: "Senior (4th Year)",
        dorm: "Turing House",
        clubs: ["ACM Chapter", "AI Society", "Hackathon Club"],
        skills: ["Distributed Systems", "Go", "Graph Theory"],
        bio: "DSA TA & competitive programmer. Researching unweighted graph traversal.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=aisha_khan"
      },
      {
        id: "lucas_silva",
        name: "Lucas Silva",
        major: "Robotics & Mech",
        year: "Sophomore (2nd Year)",
        dorm: "Newton Court",
        clubs: ["Robotics & Formula", "Music & Arts"],
        skills: ["SolidWorks", "CNC Milling", "Bass Guitar"],
        bio: "Machining custom suspension components and playing bass in the Quad band.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=lucas_silva"
      },
      {
        id: "olivia_green",
        name: "Olivia Green",
        major: "Biomedical Eng",
        year: "Junior (3rd Year)",
        dorm: "Curie Quad",
        clubs: ["BioTech Alliance", "Design Guild"],
        skills: ["Tissue Eng", "MATLAB", "Medical CAD"],
        bio: "Designing 3D-printed orthopedic casts and accessible rehab devices.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=olivia_green"
      },
      {
        id: "kevin_zhang",
        name: "Kevin Zhang",
        major: "Computer Science",
        year: "Sophomore (2nd Year)",
        dorm: "Turing House",
        clubs: ["Hackathon Club", "Student Startup Incubator"],
        skills: ["Next.js", "PostgreSQL", "Cloud Arch"],
        bio: "SaaS enthusiast building campus marketplace tools.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=kevin_zhang"
      },
      {
        id: "hannah_scott",
        name: "Hannah Scott",
        major: "Business & Fin",
        year: "Senior (4th Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator", "Music & Arts"],
        skills: ["Venture Capital", "Growth Marketing", "Event Mgmt"],
        bio: "Club President managing annual university pitch competition.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=hannah_scott"
      },
      {
        id: "devon_ross",
        name: "Devon Ross",
        major: "Design & HCI",
        year: "Freshman (1st Year)",
        dorm: "Newton Court",
        clubs: ["Design Guild"],
        skills: ["Illustration", "Typography", "Adobe CC"],
        bio: "Freshman visual artist exploring game UI and interactive narrative design.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=devon_ross"
      },
      {
        id: "rachel_cooper",
        name: "Rachel Cooper",
        major: "Biomedical Eng",
        year: "Freshman (1st Year)",
        dorm: "Curie Quad",
        clubs: ["BioTech Alliance"],
        skills: ["Organic Chemistry", "Lab Protocol", "Python"],
        bio: "Freshman pre-med engineer fascinated by genetic algorithms in medicine.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=rachel_cooper"
      },
      {
        id: "samuel_adebayo",
        name: "Samuel Adebayo",
        major: "Computer Science",
        year: "Junior (3rd Year)",
        dorm: "Newton Court",
        clubs: ["AI Society", "ACM Chapter"],
        skills: ["Computer Vision", "TensorFlow", "FastAPI"],
        bio: "Developing edge AI camera models for campus bicycle traffic monitoring.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=samuel_adebayo"
      },
      {
        id: "elena_morozova",
        name: "Elena Morozova",
        major: "Electrical & IoT",
        year: "Senior (4th Year)",
        dorm: "Apollo Hall",
        clubs: ["Hardware Lab", "AI Society"],
        skills: ["FPGA", "VHDL", "RF Circuitry"],
        bio: "Satellite communications researcher in the university cubesat program.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=elena_morozova"
      },
      {
        id: "noah_baker",
        name: "Noah Baker",
        major: "Business & Fin",
        year: "Sophomore (2nd Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator", "Hackathon Club"],
        skills: ["Market Research", "Operations", "SaaS Pricing"],
        bio: "Helping technical teams structure GTM and revenue strategies.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=noah_baker"
      },
      {
        id: "tara_sharma",
        name: "Tara Sharma",
        major: "Design & HCI",
        year: "Junior (3rd Year)",
        dorm: "Turing House",
        clubs: ["Design Guild", "BioTech Alliance"],
        skills: ["UX Research", "Data Vis", "Qualitative Analysis"],
        bio: "Bridging scientific datasets with human-centered visual dashboards.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=tara_sharma"
      },
      {
        id: "faisal_al_mansoor",
        name: "Faisal Al-Mansoor",
        major: "Robotics & Mech",
        year: "Junior (3rd Year)",
        dorm: "Apollo Hall",
        clubs: ["Robotics & Formula", "Hardware Lab"],
        skills: ["Aerodynamics", "Ansys CFD", "Telemetry"],
        bio: "Aero package designer for the university electric racer.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=faisal_al_mansoor"
      },
      {
        id: "grace_hopper_fan",
        name: "Grace Ho",
        major: "Computer Science",
        year: "Sophomore (2nd Year)",
        dorm: "Curie Quad",
        clubs: ["ACM Chapter", "Hackathon Club"],
        skills: ["Rust", "WebAssembly", "Data Structures"],
        bio: "Compilers and systems engineering buff. Co-organizer of Campus Hack 2026.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=grace_hopper_fan"
      },
      {
        id: "leo_martinez",
        name: "Leo Martinez",
        major: "Robotics & Mech",
        year: "Freshman (1st Year)",
        dorm: "Newton Court",
        clubs: ["Robotics & Formula"],
        skills: ["3D Printing", "Math Modeling", "Python"],
        bio: "Robotics newcomer working on gripper kinematics for combat robotics.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=leo_martinez"
      },
      {
        id: "jasmine_kaur",
        name: "Jasmine Kaur",
        major: "Electrical & IoT",
        year: "Sophomore (2nd Year)",
        dorm: "Apollo Hall",
        clubs: ["Hardware Lab", "Music & Arts"],
        skills: ["Audio DSP", "Synthesizers", "Analog Circuitry"],
        bio: "Designing guitar effect pedals and modular audio processors.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=jasmine_kaur"
      },
      {
        id: "benjamin_clark",
        name: "Benjamin Clark",
        major: "Business & Fin",
        year: "Freshman (1st Year)",
        dorm: "Euler Tower",
        clubs: ["Student Startup Incubator"],
        skills: ["Excel", "Public Speaking", "Community Outreach"],
        bio: "Freshman business major organizing campus networking dinners.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=benjamin_clark"
      },
      {
        id: "zoe_williams",
        name: "Zoe Williams",
        major: "Biomedical Eng",
        year: "Sophomore (2nd Year)",
        dorm: "Curie Quad",
        clubs: ["BioTech Alliance", "Music & Arts"],
        skills: ["Cell Biology", "Data Analysis", "Piano"],
        bio: "Pianist and cell culture researcher. Studying auditory neuro-pathways.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=zoe_williams"
      },
      {
        id: "dr_srinivasan",
        name: "Prof. R. Srinivasan",
        major: "Computer Science",
        year: "DSA Faculty / Evaluator",
        dorm: "Faculty House",
        clubs: ["ACM Chapter"],
        skills: ["Graph Algorithms", "Formal Verification", "Complexity"],
        bio: "Faculty Evaluator for Data Structures & Algorithms. Testing student BFS/DFS accuracy.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dr_srinivasan"
      },
      {
        id: "dr_kaufman",
        name: "Prof. Sarah Kaufman",
        major: "Design & HCI",
        year: "Faculty / Dean",
        dorm: "Faculty House",
        clubs: ["Design Guild"],
        skills: ["Interaction Design", "Cognitive Science", "Ethics"],
        bio: "Director of the Interdisciplinary Media Lab. Overseeing cross-departmental collaborations.",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=dr_kaufman"
      }
    ],
    edges: [
      // CS & Turing House connections
      { from: "alex_chen", to: "maya_lin" }, // Hackathon teammates & dorm-mates
      { from: "alex_chen", to: "aisha_khan" }, // CS peers & ACM
      { from: "alex_chen", to: "kevin_zhang" }, // Hackathon co-founders
      { from: "alex_chen", to: "david_kim" }, // IoT + FullStack hackathon bridge
      { from: "maya_lin", to: "tara_sharma" }, // Design peers in Turing House
      { from: "maya_lin", to: "chloe_dupont" }, // Design Guild leaders
      { from: "aisha_khan", to: "priya_patel" }, // Senior mentor to freshman
      { from: "aisha_khan", to: "samuel_adebayo" }, // AI Society peers
      { from: "aisha_khan", to: "dr_srinivasan" }, // TA for DSA professor
      { from: "kevin_zhang", to: "noah_baker" }, // Tech + Business startup pairing
      { from: "kevin_zhang", to: "grace_hopper_fan" }, // CS hackathon team

      // Hardware & Robotics (Apollo Hall cluster)
      { from: "marcus_vance", to: "david_kim" }, // Formula SAE chassis + electrical
      { from: "marcus_vance", to: "faisal_al_mansoor" }, // Formula aerodynamics team
      { from: "marcus_vance", to: "zack_taylor" }, // Senior mentoring freshman
      { from: "david_kim", to: "elena_morozova" }, // ECE circuit design partners
      { from: "david_kim", to: "jasmine_kaur" }, // Hardware lab peers
      { from: "faisal_al_mansoor", to: "lucas_silva" }, // Mechanical shop mates
      { from: "lucas_silva", to: "leo_martinez" }, // Robotics mentoring
      { from: "zack_taylor", to: "jasmine_kaur" }, // Apollo Hall friends

      // Bio & Curie Quad cluster
      { from: "sophia_rodriguez", to: "olivia_green" }, // BioMed research lab
      { from: "sophia_rodriguez", to: "rachel_cooper" }, // Pre-med mentor
      { from: "sophia_rodriguez", to: "samuel_adebayo" }, // AI in healthcare collaboration
      { from: "olivia_green", to: "zoe_williams" }, // BioTech alliance & Curie dorm
      { from: "priya_patel", to: "grace_hopper_fan" }, // Freshman/Sophomore CS in Curie Quad
      { from: "priya_patel", to: "zoe_williams" }, // Curie Quad floor-mates & music lovers

      // Business & Euler Tower
      { from: "ethan_wright", to: "hannah_scott" }, // Startup incubator leadership
      { from: "ethan_wright", to: "noah_baker" }, // Finance peers
      { from: "ethan_wright", to: "chloe_dupont" }, // Pitch deck design collaboration
      { from: "hannah_scott", to: "benjamin_clark" }, // Mentoring freshman
      { from: "noah_baker", to: "alex_chen" }, // Interdisciplinary startup link

      // Interdisciplinary & Music/Arts bridges
      { from: "chloe_dupont", to: "jasmine_kaur" }, // Audio synthesizer & visual art
      { from: "lucas_silva", to: "priya_patel" }, // Music band (Bass + Violin)
      { from: "tara_sharma", to: "olivia_green" }, // Healthcare UI design
      { from: "samuel_adebayo", to: "dr_srinivasan" }, // AI research mentee
      { from: "maya_lin", to: "dr_kaufman" }, // HCI advisee
      { from: "dr_srinivasan", to: "dr_kaufman" }, // Faculty committee
      { from: "devon_ross", to: "chloe_dupont" }, // Design guild freshman
      { from: "devon_ross", to: "lucas_silva" } // Newton Court friends
    ],
    posts: [
      {
        id: "post_1",
        authorId: "alex_chen",
        timestamp: "18 mins ago",
        content: "🚀 HackCampus 2026 registration is LIVE! Looking for 1 UI/UX designer and 1 hardware/IoT engineer to build a real-time decentralized quad acoustic sensor. Ping me if interested! #Hackathon #IoT #Figma",
        tags: ["#Hackathon", "#IoT", "#Figma"],
        likes: 14,
        likedBy: ["maya_lin", "david_kim", "kevin_zhang"],
        comments: [
          { authorId: "maya_lin", text: "Count me in for design & wireframes!", timestamp: "12 mins ago" },
          { authorId: "david_kim", text: "I have the ESP32 mics ready in Apollo Hall.", timestamp: "8 mins ago" }
        ]
      },
      {
        id: "post_2",
        authorId: "marcus_vance",
        timestamp: "1 hour ago",
        content: "🏎️ Apex Formula Racing will be dyno-testing the battery pack tomorrow at 4 PM behind Apollo Hall! All engineers and fans welcome to check out the telemetry system. #FormulaStudent #Robotics #HardwareLab",
        tags: ["#FormulaStudent", "#Robotics", "#HardwareLab"],
        likes: 29,
        likedBy: ["david_kim", "lucas_silva", "faisal_al_mansoor", "zack_taylor"],
        comments: [
          { authorId: "faisal_al_mansoor", text: "Rear wing carbon fiber weave finished today. Looks stealthy.", timestamp: "45 mins ago" }
        ]
      },
      {
        id: "post_3",
        authorId: "priya_patel",
        timestamp: "2 hours ago",
        content: "Anyone forming a study group for Prof. Srinivasan's Advanced Graph DSA midterm next Tuesday? Looking to whiteboard BFS vs DFS tree traversals! 📚 #DSAStudyGroup #ComputerScience #ACM",
        tags: ["#DSAStudyGroup", "#ComputerScience", "#ACM"],
        likes: 8,
        likedBy: ["aisha_khan", "grace_hopper_fan"],
        comments: [
          { authorId: "aisha_khan", text: "As your TA, I'll be hosting office hours in Turing House on Friday at 5pm!", timestamp: "1 hour ago" }
        ]
      },
      {
        id: "post_4",
        authorId: "ethan_wright",
        timestamp: "3 hours ago",
        content: "💡 Student Startup Incubator grant deadline is this Friday. $15,000 equity-free seed grant for interdisciplinary teams (must include at least 2 distinct academic majors). Reach out for pitch deck reviews! #Startups #FinTech #Incubator",
        tags: ["#Startups", "#FinTech", "#Incubator"],
        likes: 21,
        likedBy: ["alex_chen", "hannah_scott", "chloe_dupont", "noah_baker"],
        comments: []
      },
      {
        id: "post_5",
        authorId: "lucas_silva",
        timestamp: "5 hours ago",
        content: "Jam session at the Quad amphitheater this sunset! Bass + violin + synths. Bring your instruments or just come listen! 🎸🎻 #MusicBand #QuadJam #CampusLife",
        tags: ["#MusicBand", "#QuadJam", "#CampusLife"],
        likes: 35,
        likedBy: ["priya_patel", "jasmine_kaur", "chloe_dupont", "zoe_williams"],
        comments: [
          { authorId: "priya_patel", text: "Bringing my violin right after lab!", timestamp: "4 hours ago" }
        ]
      }
    ]
  },

  // Preset 2: Siloed Clusters (demonstrates departmental silos, isolated subgraphs, bottleneck bridges)
  siloedCampus: {
    name: "Departmental Silos & Disconnected Dorms",
    description: "Three isolated clusters (CS & Math, Arts & Design, Business & Law) with minimal inter-department connectivity to test Connected Components and bridging recommendations.",
    students: [
      // Cluster A: CS & Math
      { id: "cs_1", name: "Alice (CS Lead)", major: "Computer Science", year: "Senior", dorm: "Turing House", clubs: ["ACM Chapter"], skills: ["Algorithms", "C++"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_1" },
      { id: "cs_2", name: "Bob (Data Science)", major: "Computer Science", year: "Junior", dorm: "Turing House", clubs: ["AI Society"], skills: ["Python", "SQL"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_2" },
      { id: "cs_3", name: "Charlie (CyberSec)", major: "Computer Science", year: "Sophomore", dorm: "Turing House", clubs: ["Hackathon Club"], skills: ["Linux", "Networks"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_3" },
      { id: "cs_4", name: "Diana (Math)", major: "Computer Science", year: "Freshman", dorm: "Turing House", clubs: ["ACM Chapter"], skills: ["Discrete Math"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=cs_4" },

      // Cluster B: Arts & Design (Completely isolated cluster)
      { id: "art_1", name: "Elena (Visual Art)", major: "Design & HCI", year: "Senior", dorm: "Curie Quad", clubs: ["Design Guild"], skills: ["Oil Painting", "Typography"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_1" },
      { id: "art_2", name: "Felix (Industrial)", major: "Design & HCI", year: "Junior", dorm: "Curie Quad", clubs: ["Design Guild"], skills: ["CAD", "Ceramics"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_2" },
      { id: "art_3", name: "Gina (UI/UX)", major: "Design & HCI", year: "Sophomore", dorm: "Curie Quad", clubs: ["Design Guild"], skills: ["Figma", "Interaction"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_3" },
      { id: "art_4", name: "Hugo (Animation)", major: "Design & HCI", year: "Freshman", dorm: "Curie Quad", clubs: ["Music & Arts"], skills: ["After Effects", "Blender"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=art_4" },

      // Cluster C: Business & Management (Isolated cluster)
      { id: "biz_1", name: "Isla (Finance Lead)", major: "Business & Fin", year: "Senior", dorm: "Euler Tower", clubs: ["Student Startup Incubator"], skills: ["Valuation", "M&A"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=biz_1" },
      { id: "biz_2", name: "Jack (Marketing)", major: "Business & Fin", year: "Junior", dorm: "Euler Tower", clubs: ["Student Startup Incubator"], skills: ["Growth", "SEO"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=biz_2" },
      { id: "biz_3", name: "Kiran (Operations)", major: "Business & Fin", year: "Sophomore", dorm: "Euler Tower", clubs: ["Student Startup Incubator"], skills: ["Logistics", "Excel"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=biz_3" },
      
      // Isolated Student
      { id: "solo_1", name: "Leo (Solo Transfer Student)", major: "Biomedical Eng", year: "Junior", dorm: "Newton Court", clubs: [], skills: ["Biomechanics"], avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=solo_1" }
    ],
    edges: [
      // Cluster A internal
      { from: "cs_1", to: "cs_2" },
      { from: "cs_2", to: "cs_3" },
      { from: "cs_3", to: "cs_4" },
      { from: "cs_1", to: "cs_4" },

      // Cluster B internal
      { from: "art_1", to: "art_2" },
      { from: "art_2", to: "art_3" },
      { from: "art_3", to: "art_4" },
      { from: "art_1", to: "art_3" },

      // Cluster C internal
      { from: "biz_1", to: "biz_2" },
      { from: "biz_2", to: "biz_3" },
      { from: "biz_1", to: "biz_3" }
      // Notice: zero edges between clusters! Perfect for testing Connected Components detection and Disconnected BFS handling!
    ],
    posts: [
      {
        id: "post_s1",
        authorId: "cs_1",
        timestamp: "30 mins ago",
        content: "Working on distributed consensus protocols in Turing House. Anyone interested in Paxos / Raft? #ACM #ComputerScience",
        tags: ["#ACM", "#ComputerScience"],
        likes: 4,
        likedBy: ["cs_2"],
        comments: []
      },
      {
        id: "post_s2",
        authorId: "art_1",
        timestamp: "1 hour ago",
        content: "Annual campus typography exhibition opens this Thursday in Curie Quad Gallery. Free sketches for visitors! #DesignGuild #ArtExhibition",
        tags: ["#DesignGuild", "#ArtExhibition"],
        likes: 6,
        likedBy: ["art_2", "art_3"],
        comments: []
      }
    ]
  }
};
