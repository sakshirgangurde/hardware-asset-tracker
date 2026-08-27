import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Hardware Asset Tracker database seed...");

  // Clean existing data
  await prisma.disposalRecord.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.assignmentHistory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.adminUser.deleteMany();

  console.log("🧹 Cleaned existing database tables");

  // 1. Create Admin User
  const passwordHash = await bcrypt.hash("adminpassword123", 10);
  const admin = await prisma.adminUser.create({
    data: {
      email: "admin@hardwaretracker.com",
      passwordHash,
      name: "Global IT Administrator",
    },
  });
  console.log(`👤 Created Admin: ${admin.email} / adminpassword123`);

  // 2. Create Employees
  const employeesData = [
    // Hyderabad Office
    {
      name: "Aarav Sharma",
      email: "aarav.sharma@company.com",
      department: "Engineering",
      officeLocation: "HYD",
      status: "ACTIVE",
      startDate: new Date("2022-03-15"),
      notes: "Lead Fullstack Engineer, Tech Lead Pod Alpha",
    },
    {
      name: "Priya Patel",
      email: "priya.patel@company.com",
      department: "Product",
      officeLocation: "HYD",
      status: "ACTIVE",
      startDate: new Date("2023-01-10"),
      notes: "Staff Product Manager for Enterprise Core",
    },
    {
      name: "Rohan Verma",
      email: "rohan.verma@company.com",
      department: "DevOps & Cloud",
      officeLocation: "HYD",
      status: "ACTIVE",
      startDate: new Date("2022-07-01"),
      notes: "Principal Cloud Platform Architect",
    },
    {
      name: "Ananya Rao",
      email: "ananya.rao@company.com",
      department: "Quality Assurance",
      officeLocation: "HYD",
      status: "ACTIVE",
      startDate: new Date("2023-05-18"),
      notes: "SDET Lead",
    },
    {
      name: "Divya Krishnan",
      email: "divya.krishnan@company.com",
      department: "Human Resources",
      officeLocation: "HYD",
      status: "ACTIVE",
      startDate: new Date("2021-11-01"),
      notes: "People Operations Manager",
    },
    {
      name: "Vikram Malhotra",
      email: "vikram.malhotra@company.com",
      department: "Sales",
      officeLocation: "HYD",
      status: "OFFBOARDED",
      startDate: new Date("2022-02-01"),
      endDate: new Date("2026-07-15"),
      notes: "Former Regional Sales Director. Offboarded with 1 pending unreturned monitor.",
    },
    // Mumbai Office
    {
      name: "Kabir Deshmukh",
      email: "kabir.deshmukh@company.com",
      department: "Design & UX",
      officeLocation: "MUM",
      status: "ACTIVE",
      startDate: new Date("2022-09-01"),
      notes: "Principal Product Designer",
    },
    {
      name: "Neha Joshi",
      email: "neha.joshi@company.com",
      department: "Marketing",
      officeLocation: "MUM",
      status: "ACTIVE",
      startDate: new Date("2023-04-01"),
      notes: "Brand & Growth Marketing Lead",
    },
    {
      name: "Siddharth Kulkarni",
      email: "siddharth.kulkarni@company.com",
      department: "Finance",
      officeLocation: "MUM",
      status: "ACTIVE",
      startDate: new Date("2021-08-15"),
      notes: "Director of Financial Planning & Analysis",
    },
    {
      name: "Tanvi Nair",
      email: "tanvi.nair@company.com",
      department: "Customer Success",
      officeLocation: "MUM",
      status: "ACTIVE",
      startDate: new Date("2023-08-20"),
      notes: "Enterprise Customer Success Manager",
    },
    {
      name: "Arjun Mehta",
      email: "arjun.mehta@company.com",
      department: "Engineering",
      officeLocation: "MUM",
      status: "OFFBOARDED",
      startDate: new Date("2023-02-10"),
      endDate: new Date("2026-06-30"),
      notes: "Relocated abroad. All equipment returned on exit.",
    },
  ];

  const createdEmployees: Record<string, string> = {};
  for (const emp of employeesData) {
    const record = await prisma.employee.create({ data: emp });
    createdEmployees[emp.email] = record.id;
  }
  console.log(`👥 Seeded ${employeesData.length} employees`);

  // Helper date generators relative to current year
  const now = new Date();
  const addDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };
  const subDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  // 3. Create Hardware Assets (22 Diverse Assets across HYD & MUM)
  const assetsData = [
    // Laptops - In Use
    {
      assetTag: "AST-LAP-001",
      name: "MacBook Pro 16\" M3 Max",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Pro 16 (2024)",
      serialNumber: "C02G4589MD6R",
      status: "IN_USE",
      employeeId: createdEmployees["aarav.sharma@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(180),
      vendor: "Apple Authorized Corporate Reseller",
      warrantyExpiry: addDays(550), // Healthy warranty
      accessories: "140W USB-C Charger, Braided MagSafe Cable, Laptop Sleeve",
      notes: "Assigned for high-performance development and local LLM testing.",
    },
    {
      assetTag: "AST-LAP-002",
      name: "Dell XPS 15 9530 OLED",
      category: "Laptop",
      brand: "Dell",
      model: "XPS 15 (i9-13900H / 32GB / 1TB SSD)",
      serialNumber: "8XYZ901A",
      status: "IN_USE",
      employeeId: createdEmployees["priya.patel@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(300),
      vendor: "Dell Direct India",
      warrantyExpiry: addDays(25), // Expiring in < 30 days!
      accessories: "130W USB-C Power Adapter, Dell Premier Sleeve",
      notes: "Primary machine for Product Management.",
    },
    {
      assetTag: "AST-LAP-003",
      name: "Lenovo ThinkPad X1 Carbon Gen 11",
      category: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad X1 Carbon (i7 / 32GB RAM)",
      serialNumber: "PF34ABCD9",
      status: "IN_USE",
      employeeId: createdEmployees["rohan.verma@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(400),
      vendor: "Lenovo Commercial Stores",
      warrantyExpiry: addDays(50), // Expiring in < 60 days!
      accessories: "65W GaN Charger, ThinkPad Precision Mouse",
      notes: "Configured with Linux kernel 6.x & Docker workstation.",
    },
    {
      assetTag: "AST-LAP-004",
      name: "MacBook Air 15\" M2",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Air 15 (16GB / 512GB)",
      serialNumber: "H89KL34001",
      status: "IN_USE",
      employeeId: createdEmployees["ananya.rao@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(240),
      vendor: "Apple India",
      warrantyExpiry: addDays(85), // Expiring in < 90 days!
      accessories: "35W Dual USB-C Adapter",
      notes: "QA automation station.",
    },
    {
      assetTag: "AST-LAP-005",
      name: "MacBook Pro 14\" M3 Pro",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Pro 14 (36GB RAM / 1TB)",
      serialNumber: "C02MN49281",
      status: "IN_USE",
      employeeId: createdEmployees["kabir.deshmukh@company.com"],
      officeLocation: "MUM",
      purchaseDate: subDays(150),
      vendor: "Apple India Enterprise",
      warrantyExpiry: addDays(400),
      accessories: "96W Power Adapter, Space Black Sleeve",
      notes: "Calibrated Liquid Retina XDR for Figma UI/UX design.",
    },
    {
      assetTag: "AST-LAP-006",
      name: "HP EliteBook 840 G10",
      category: "Laptop",
      brand: "HP",
      model: "EliteBook 840 G10 (i7-1365U)",
      serialNumber: "5CD3490X12",
      status: "IN_USE",
      employeeId: createdEmployees["neha.joshi@company.com"],
      officeLocation: "MUM",
      purchaseDate: subDays(210),
      vendor: "HP Enterprise Solutions",
      warrantyExpiry: addDays(320),
      accessories: "65W USB-C Adapter, Wireless Mouse",
      notes: "Marketing workstation.",
    },
    {
      assetTag: "AST-LAP-007",
      name: "Dell Latitude 7440",
      category: "Laptop",
      brand: "Dell",
      model: "Latitude 7440 Ultralight",
      serialNumber: "349DK88219",
      status: "IN_USE",
      employeeId: createdEmployees["siddharth.kulkarni@company.com"],
      officeLocation: "MUM",
      purchaseDate: subDays(360),
      vendor: "Dell Direct India",
      warrantyExpiry: addDays(18), // Expiring in < 30 days!
      accessories: "Dell 65W GaN adapter",
      notes: "Finance department laptop.",
    },
    {
      assetTag: "AST-LAP-008",
      name: "MacBook Air 13\" M3",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Air 13 (16GB / 512GB)",
      serialNumber: "C02PQ8931A",
      status: "IN_USE",
      employeeId: createdEmployees["tanvi.nair@company.com"],
      officeLocation: "MUM",
      purchaseDate: subDays(90),
      vendor: "Apple Authorized Corp",
      warrantyExpiry: addDays(275),
      accessories: "35W Dual Port Adapter",
      notes: "Customer Success machine.",
    },
    {
      assetTag: "AST-LAP-009",
      name: "ThinkPad T14s Gen 4",
      category: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad T14s (AMD Ryzen 7 PRO)",
      serialNumber: "PF2981XX4",
      status: "IN_USE",
      employeeId: createdEmployees["divya.krishnan@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(180),
      vendor: "Lenovo India",
      warrantyExpiry: addDays(350),
      accessories: "65W Type-C adapter",
      notes: "HR & Recruitment management laptop.",
    },

    // In Stock Inventory (HYD & MUM)
    {
      assetTag: "AST-LAP-010",
      name: "MacBook Pro 14\" M3 (Ready for Deploy)",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Pro 14 (18GB / 512GB)",
      serialNumber: "C02WW99231",
      status: "IN_STOCK",
      employeeId: null,
      officeLocation: "HYD",
      purchaseDate: subDays(45),
      vendor: "Apple Enterprise",
      warrantyExpiry: addDays(320),
      accessories: "70W USB-C Charger, In original box",
      notes: "Spare engineering laptop ready for new onboarding.",
    },
    {
      assetTag: "AST-LAP-011",
      name: "Dell XPS 13 Plus 9320",
      category: "Laptop",
      brand: "Dell",
      model: "XPS 13 Plus (i7 / 16GB / 512GB)",
      serialNumber: "7KOP8831B",
      status: "IN_STOCK",
      employeeId: null,
      officeLocation: "MUM",
      purchaseDate: subDays(60),
      vendor: "Dell Direct",
      warrantyExpiry: addDays(305),
      accessories: "60W USB-C Adapter, Type-C Dongle",
      notes: "Buffer stock in Mumbai IT locker.",
    },

    // Desktops & Workstations
    {
      assetTag: "AST-DSK-001",
      name: "Mac Studio M2 Ultra",
      category: "Desktop",
      brand: "Apple",
      model: "Mac Studio (64GB Unified / 1TB)",
      serialNumber: "MJ9018442X",
      status: "IN_USE",
      employeeId: createdEmployees["aarav.sharma@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(320),
      vendor: "Apple Commercial",
      warrantyExpiry: addDays(410),
      accessories: "Magic Keyboard with Touch ID, Magic Mouse, Power cable",
      notes: "Hyd Office dedicated AI & Compilation build station.",
    },
    {
      assetTag: "AST-DSK-002",
      name: "Dell Precision 3660 Tower Workstation",
      category: "Desktop",
      brand: "Dell",
      model: "Precision 3660 (Core i9 / RTX 4000 / 64GB)",
      serialNumber: "9DKL88301A",
      status: "IN_STOCK",
      employeeId: null,
      officeLocation: "HYD",
      purchaseDate: subDays(150),
      vendor: "Dell Enterprise",
      warrantyExpiry: addDays(580),
      accessories: "Dell Wired Pro Keyboard & Mouse",
      notes: "High-spec 3D simulation desktop in Server Room A.",
    },

    // Monitors
    {
      assetTag: "AST-MON-001",
      name: "Dell UltraSharp 27\" 4K USB-C Hub Monitor",
      category: "Monitor",
      brand: "Dell",
      model: "U2723QE (IPS Black, 90W PD)",
      serialNumber: "CN-08D93K-744",
      status: "IN_USE",
      employeeId: createdEmployees["aarav.sharma@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(220),
      vendor: "Dell Direct",
      warrantyExpiry: addDays(510),
      accessories: "Stand, Thunderbolt 4 Cable, Power Cable, DP Cable",
      notes: "Desk HYD-L3-042.",
    },
    {
      assetTag: "AST-MON-002",
      name: "LG 34\" Curved UltraWide Ergo",
      category: "Monitor",
      brand: "LG",
      model: "34WN780-B Ergo Stand",
      serialNumber: "302NTRP8901",
      status: "IN_USE",
      employeeId: createdEmployees["kabir.deshmukh@company.com"],
      officeLocation: "MUM",
      purchaseDate: subDays(310),
      vendor: "Croma Commercial Sales",
      warrantyExpiry: addDays(420),
      accessories: "Ergo Desk Clamp, HDMI, USB-C Cable",
      notes: "Desk MUM-FL2-019.",
    },
    {
      assetTag: "AST-MON-003",
      name: "Dell UltraSharp 32\" 4K PremierColor",
      category: "Monitor",
      brand: "Dell",
      model: "UP3218K 8K Professional",
      serialNumber: "CN-039KLP-119",
      status: "IN_STOCK",
      officeLocation: "MUM",
      purchaseDate: subDays(90),
      vendor: "Dell Direct",
      warrantyExpiry: addDays(640),
      accessories: "Heavy-duty stand, Dual DP cables",
      notes: "Spare monitor in Mumbai inventory room.",
    },
    {
      // UNRETURNED ASSET FROM OFFBOARDED EMPLOYEE (Triggers Dashboard Alert)
      assetTag: "AST-MON-004",
      name: "BenQ PD2700U 27\" 4K Designer Monitor",
      category: "Monitor",
      brand: "BenQ",
      model: "PD2700U 100% sRGB",
      serialNumber: "ETL8J019293",
      status: "IN_USE",
      employeeId: createdEmployees["vikram.malhotra@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(450),
      vendor: "Amazon Business",
      warrantyExpiry: addDays(280),
      accessories: "Desk stand, Mini DP cable, Power cord",
      notes: "ALERT: Employee Vikram Malhotra offboarded; pending physical return or courier pick-up.",
    },

    // Peripherals & Accessories
    {
      assetTag: "AST-PER-001",
      name: "CalDigit TS4 Thunderbolt 4 Dock",
      category: "Peripheral",
      brand: "CalDigit",
      model: "TS4 (18 Ports, 98W Power Delivery)",
      serialNumber: "TS4-IN-90812",
      status: "IN_USE",
      employeeId: createdEmployees["aarav.sharma@company.com"],
      officeLocation: "HYD",
      purchaseDate: subDays(160),
      vendor: "B&H Global Import",
      warrantyExpiry: addDays(205),
      accessories: "230W Power Brick, TB4 0.8m Cable",
      notes: "Engineering dock station.",
    },
    {
      assetTag: "AST-PER-002",
      name: "Logitech MX Master 3S + MX Keys Combo",
      category: "Peripheral",
      brand: "Logitech",
      model: "MX Performance Combo",
      serialNumber: "2323LZ8810",
      status: "IN_STOCK",
      officeLocation: "HYD",
      purchaseDate: subDays(50),
      vendor: "Logitech B2B",
      warrantyExpiry: addDays(315),
      accessories: "Logi Bolt Receiver, Type-C charging wire",
      notes: "Ready for allocation.",
    },

    // Networking Equipment
    {
      assetTag: "AST-NET-001",
      name: "Cisco Catalyst 9300 48-Port PoE+ Switch",
      category: "Networking",
      brand: "Cisco",
      model: "C9300-48P-A",
      serialNumber: "FOC2438L99X",
      status: "IN_USE",
      officeLocation: "HYD",
      purchaseDate: subDays(600),
      vendor: "Wipro Infotech Cisco Gold Partner",
      warrantyExpiry: addDays(490),
      accessories: "Rack ears, dual 1100W AC power supplies",
      notes: "Main Server Rack 1, Hyderabad Office IDF.",
    },
    {
      assetTag: "AST-NET-002",
      name: "Ubiquiti UniFi Dream Machine Pro",
      category: "Networking",
      brand: "Ubiquiti",
      model: "UDM-Pro Enterprise Gateway",
      serialNumber: "7483C29910F1",
      status: "IN_USE",
      officeLocation: "MUM",
      purchaseDate: subDays(380),
      vendor: "UniFi India Distro",
      warrantyExpiry: addDays(350),
      accessories: "1U Rackmount brackets, power cord",
      notes: "Primary Security Gateway for Mumbai office network.",
    },

    // Assets Under Repair
    {
      assetTag: "AST-LAP-012",
      name: "Lenovo ThinkPad P1 Gen 6",
      category: "Laptop",
      brand: "Lenovo",
      model: "ThinkPad P1 (RTX 4080 Mobile)",
      serialNumber: "PF99821KK3",
      status: "UNDER_REPAIR",
      officeLocation: "HYD",
      purchaseDate: subDays(280),
      vendor: "Lenovo Commercial",
      warrantyExpiry: addDays(440),
      accessories: "230W Slim Tip Charger",
      notes: "Sent to Lenovo authorized service center for motherboard replacement after power surge.",
    },

    // Scrapped / Disposed Assets (for retention & disposal logs)
    {
      assetTag: "AST-LAP-013",
      name: "Dell Latitude 5490 (Scrapped)",
      category: "Laptop",
      brand: "Dell",
      model: "Latitude 5490 (8th Gen i5)",
      serialNumber: "8HKL9901A",
      status: "SCRAPPED",
      officeLocation: "HYD",
      purchaseDate: subDays(1500),
      vendor: "Dell Direct",
      warrantyExpiry: subDays(400),
      accessories: "None",
      notes: "Liquid damage on motherboard and swollen battery. Replaced and scrapped.",
    },
    {
      assetTag: "AST-LAP-014",
      name: "MacBook Air 13\" 2019 (Lost in Transit)",
      category: "Laptop",
      brand: "Apple",
      model: "MacBook Air (Intel Dual-Core i5)",
      serialNumber: "C02A881023",
      status: "LOST",
      officeLocation: "MUM",
      purchaseDate: subDays(1100),
      vendor: "Apple Reseller",
      warrantyExpiry: subDays(360),
      accessories: "Charger",
      notes: "Lost during remote return courier transit in 2025. Police FIR and insurance claim filed.",
    },
  ];

  const createdAssets: Record<string, string> = {};
  for (const asset of assetsData) {
    const record = await prisma.asset.create({ data: asset });
    createdAssets[asset.assetTag] = record.id;
  }
  console.log(`📦 Seeded ${assetsData.length} hardware assets`);

  // 4. Create Assignment Histories
  const assignmentHistories = [
    // Current open assignments
    {
      assetId: createdAssets["AST-LAP-001"],
      employeeId: createdEmployees["aarav.sharma@company.com"],
      assignedDate: subDays(175),
      notes: "Initial laptop provision upon onboarding.",
    },
    {
      assetId: createdAssets["AST-LAP-002"],
      employeeId: createdEmployees["priya.patel@company.com"],
      assignedDate: subDays(290),
      notes: "Assigned Dell XPS 15.",
    },
    {
      assetId: createdAssets["AST-LAP-003"],
      employeeId: createdEmployees["rohan.verma@company.com"],
      assignedDate: subDays(390),
      notes: "Assigned ThinkPad X1.",
    },
    {
      assetId: createdAssets["AST-LAP-004"],
      employeeId: createdEmployees["ananya.rao@company.com"],
      assignedDate: subDays(230),
      notes: "Allocated MacBook Air 15.",
    },
    {
      assetId: createdAssets["AST-LAP-005"],
      employeeId: createdEmployees["kabir.deshmukh@company.com"],
      assignedDate: subDays(140),
      notes: "Design lead MacBook Pro 14.",
    },
    {
      assetId: createdAssets["AST-LAP-006"],
      employeeId: createdEmployees["neha.joshi@company.com"],
      assignedDate: subDays(200),
      notes: "Marketing laptop assignment.",
    },
    {
      assetId: createdAssets["AST-LAP-007"],
      employeeId: createdEmployees["siddharth.kulkarni@company.com"],
      assignedDate: subDays(350),
      notes: "Finance team allocation.",
    },
    {
      assetId: createdAssets["AST-LAP-008"],
      employeeId: createdEmployees["tanvi.nair@company.com"],
      assignedDate: subDays(85),
      notes: "CS team laptop allocation.",
    },
    {
      assetId: createdAssets["AST-LAP-009"],
      employeeId: createdEmployees["divya.krishnan@company.com"],
      assignedDate: subDays(170),
      notes: "HR team laptop allocation.",
    },
    {
      assetId: createdAssets["AST-DSK-001"],
      employeeId: createdEmployees["aarav.sharma@company.com"],
      assignedDate: subDays(300),
      notes: "Mac Studio workstation setup at desk.",
    },
    {
      assetId: createdAssets["AST-MON-001"],
      employeeId: createdEmployees["aarav.sharma@company.com"],
      assignedDate: subDays(210),
      notes: "4K Monitor setup.",
    },
    {
      assetId: createdAssets["AST-MON-002"],
      employeeId: createdEmployees["kabir.deshmukh@company.com"],
      assignedDate: subDays(300),
      notes: "UltraWide Curved monitor setup in Mumbai office.",
    },
    {
      assetId: createdAssets["AST-PER-001"],
      employeeId: createdEmployees["aarav.sharma@company.com"],
      assignedDate: subDays(150),
      notes: "Thunderbolt 4 Dock setup.",
    },
    {
      // Open assignment for offboarded user
      assetId: createdAssets["AST-MON-004"],
      employeeId: createdEmployees["vikram.malhotra@company.com"],
      assignedDate: subDays(400),
      notes: "Monitor assigned for WFH setup. Unreturned upon departure.",
    },
    // Past closed assignments (for history testing)
    {
      assetId: createdAssets["AST-LAP-010"],
      employeeId: createdEmployees["arjun.mehta@company.com"],
      assignedDate: subDays(300),
      returnedDate: subDays(60),
      notes: "Returned in immaculate condition when Arjun Mehta offboarded.",
    },
    {
      assetId: createdAssets["AST-LAP-011"],
      employeeId: createdEmployees["neha.joshi@company.com"],
      assignedDate: subDays(350),
      returnedDate: subDays(215),
      notes: "Temporary loaner laptop while waiting for HP EliteBook.",
    },
  ];

  for (const hist of assignmentHistories) {
    await prisma.assignmentHistory.create({ data: hist });
  }
  console.log(`📜 Seeded ${assignmentHistories.length} assignment history records`);

  // 5. Create Maintenance Logs
  const maintenanceLogs = [
    {
      assetId: createdAssets["AST-LAP-012"],
      dateReported: subDays(14),
      issueDescription: "No display output after thunderstorm; burning odor near charging port.",
      sentTo: "Lenovo Authorized Service Center (Hyd Cyber Towers)",
      dateReturned: null,
      outcome: "PENDING",
      performedBy: "DevOps / IT Support Team",
    },
    {
      assetId: createdAssets["AST-LAP-002"],
      dateReported: subDays(120),
      issueDescription: "Thermal throttling and noisy cooling fan.",
      sentTo: "Dell On-site Technician",
      dateReturned: subDays(118),
      outcome: "REPAIRED",
      performedBy: "Dell ProSupport Engineer",
    },
    {
      assetId: createdAssets["AST-LAP-013"],
      dateReported: subDays(90),
      issueDescription: "Total motherboard short-circuit caused by coffee spill.",
      sentTo: "Dell Care Center",
      dateReturned: subDays(80),
      outcome: "UNREPAIRABLE",
      performedBy: "Dell Diagnostics Lab",
    },
  ];

  for (const log of maintenanceLogs) {
    await prisma.maintenanceLog.create({ data: log });
  }
  console.log(`🔧 Seeded ${maintenanceLogs.length} maintenance log records`);

  // 6. Create Disposal Records (Auditing)
  const disposalRecords = [
    {
      assetId: createdAssets["AST-LAP-013"],
      disposalDate: subDays(75),
      disposalReason: "DAMAGED_BEYOND_REPAIR",
      notes: "Motherboard corroded beyond repair. Storage drive securely wiped/degaussed according to NIST 800-88 standards.",
    },
    {
      assetId: createdAssets["AST-LAP-014"],
      disposalDate: subDays(200),
      disposalReason: "LOST",
      notes: "Asset lost in transit with BlueDart Courier. Tracking ID BD99817290. Written off under corporate insurance.",
    },
  ];

  for (const disp of disposalRecords) {
    await prisma.disposalRecord.create({ data: disp });
  }
  console.log(`🗑️ Seeded ${disposalRecords.length} disposal records`);

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
