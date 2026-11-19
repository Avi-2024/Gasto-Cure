require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

async function seed() {
  console.log('🌱 Starting ClinixPulse™ Multi-Tenant Database Seed...');

  const passwordHash = await bcrypt.hash('Doctor@1234', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);

  // 1. Create Super Admin (Platform Owner)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@clinixpulse.com' },
    update: {},
    create: {
      email: 'admin@clinixpulse.com',
      fullName: 'ClinixPulse Platform Admin',
      phone: '+919999999999',
      passwordHash: adminPasswordHash,
      globalRole: 'SUPER_ADMIN',
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Create Clinic Tenant 1: Gastro Cure Digestive & Liver Centre
  const clinic1 = await prisma.clinic.upsert({
    where: { code: 'GC' },
    update: {},
    create: {
      code: 'GC',
      slug: 'gastro-cure',
      name: 'Gastro Cure Digestive & Liver Centre',
      shortName: 'Gastro Cure',
      tagline: 'Digestive & Liver Health Specialists',
      phone: '+919876543210',
      email: 'care@gastrocure.in',
      whatsappNumber: '+919876543210',
      addressLine1: 'Shop No. 4, Ground Floor, Gastro Cure Medical Centre',
      city: 'Unchehra',
      state: 'Madhya Pradesh',
      pincode: '485661',
      country: 'India',
      stationeryMode: 'DIGITAL',
      topMarginMm: 35,
      bottomMarginMm: 20,
      watermarkEnabled: true,
      watermarkOpacity: 0.05,
      primaryColor: '#123A3A',
      accentColor: '#C9A45C',
      plan: 'PRO',
      planStatus: 'ACTIVE',
    },
  });
  console.log(`✅ Clinic 1 Tenant created: ${clinic1.name} (Code: ${clinic1.code})`);

  // 3. Create Clinic Tenant 2: Apex Heart & Multi-Speciality Clinic
  const clinic2 = await prisma.clinic.upsert({
    where: { code: 'APEX' },
    update: {},
    create: {
      code: 'APEX',
      slug: 'apex-heart-care',
      name: 'Apex Heart & Multi-Speciality Clinic',
      shortName: 'Apex Heart Care',
      tagline: 'Comprehensive Cardiac & Preventative Healthcare',
      phone: '+919123456789',
      email: 'contact@apexheart.in',
      whatsappNumber: '+919123456789',
      addressLine1: 'Suite 201, Metro Towers, AB Road',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      country: 'India',
      stationeryMode: 'DIGITAL',
      topMarginMm: 38,
      bottomMarginMm: 22,
      watermarkEnabled: true,
      watermarkOpacity: 0.06,
      primaryColor: '#0F2942',
      accentColor: '#0EA5E9',
      plan: 'ENTERPRISE',
      planStatus: 'ACTIVE',
    },
  });
  console.log(`✅ Clinic 2 Tenant created: ${clinic2.name} (Code: ${clinic2.code})`);

  // 4. Create Doctor 1: Dr. Snehal Makwana (Primary doctor in Gastro Cure)
  const doctor1 = await prisma.user.upsert({
    where: { email: 'doctor@gastrocure.in' },
    update: {},
    create: {
      email: 'doctor@gastrocure.in',
      fullName: 'Dr. Snehal Makwana',
      phone: '+919876543211',
      passwordHash,
      defaultClinicId: clinic1.id,
      memberships: {
        create: [
          {
            clinicId: clinic1.id,
            role: 'CLINIC_OWNER',
            regNumber: 'MP-MED-48291',
            qualifications: 'MBBS, MD (Medicine), DM (Gastroenterology)',
            specialization: 'Gastroenterologist & Hepatologist',
            consultationFee: 700,
          },
          {
            clinicId: clinic2.id,
            role: 'DOCTOR',
            regNumber: 'MP-MED-48291',
            qualifications: 'MBBS, MD (Medicine), DM (Gastroenterology)',
            specialization: 'Visiting GI Consultant',
            consultationFee: 900,
          },
        ],
      },
    },
  });
  console.log(`✅ Doctor 1 created: ${doctor1.fullName} (Active in both clinics)`);

  // 5. Create Receptionist for Gastro Cure
  const receptionist = await prisma.user.upsert({
    where: { email: 'frontdesk@gastrocure.in' },
    update: {},
    create: {
      email: 'frontdesk@gastrocure.in',
      fullName: 'Aakash Sharma',
      phone: '+919876543212',
      passwordHash,
      defaultClinicId: clinic1.id,
      memberships: {
        create: [
          {
            clinicId: clinic1.id,
            role: 'RECEPTIONIST',
          },
        ],
      },
    },
  });
  console.log(`✅ Receptionist created: ${receptionist.fullName}`);

  // 6. Create Seed Patients in Gastro Cure
  const patient1 = await prisma.patient.upsert({
    where: {
      clinicId_mrn: {
        clinicId: clinic1.id,
        mrn: 'GC-2026-0001',
      },
    },
    update: {},
    create: {
      clinicId: clinic1.id,
      mrn: 'GC-2026-0001',
      name: 'Rajesh Kumar',
      age: 42,
      gender: 'MALE',
      phone: '+919876500001',
      bloodGroup: 'B+',
      allergies: ['Penicillin', 'Sulfa drugs'],
      chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
      address: 'Near Old Bus Stand, Unchehra, MP',
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: {
      clinicId_mrn: {
        clinicId: clinic1.id,
        mrn: 'GC-2026-0002',
      },
    },
    update: {},
    create: {
      clinicId: clinic1.id,
      mrn: 'GC-2026-0002',
      name: 'Maya Verma',
      age: 36,
      gender: 'FEMALE',
      phone: '+919876500002',
      bloodGroup: 'O+',
      allergies: [],
      chronicConditions: ['GERD', 'Fatty Liver Grade I'],
      address: 'Civil Lines, Satna, MP',
    },
  });
  console.log(`✅ Seed Patients created: ${patient1.name}, ${patient2.name}`);

  // 7. Create Global Formulary Drugs
  const commonDrugs = [
    { brandName: 'Pan 40', genericName: 'Pantoprazole 40mg', category: 'PPI / Antacid', dosageForm: 'Tablet', strength: '40mg', defaultTiming: 'Before Food', defaultFrequency: '1-0-0', defaultDuration: '14 Days' },
    { brandName: 'Udiliv 300', genericName: 'Ursodeoxycholic Acid 300mg', category: 'Hepatoprotective', dosageForm: 'Tablet', strength: '300mg', defaultTiming: 'After Food', defaultFrequency: '1-0-1', defaultDuration: '30 Days' },
    { brandName: 'Rifaximin 400', genericName: 'Rifaximin 400mg', category: 'GI Antibiotic', dosageForm: 'Tablet', strength: '400mg', defaultTiming: 'After Food', defaultFrequency: '1-0-1', defaultDuration: '7 Days' },
    { brandName: 'Ganaton Total', genericName: 'Itopride + Pantoprazole', category: 'Prokinetic', dosageForm: 'Capsule', strength: '150mg', defaultTiming: 'Before Food', defaultFrequency: '1-0-0', defaultDuration: '10 Days' },
    { brandName: 'Cremaffin Plus', genericName: 'Liquid Paraffin + Milk of Magnesia', category: 'Laxative', dosageForm: 'Syrup', strength: '200ml', defaultTiming: 'At Bedtime', defaultFrequency: '0-0-2 tsp', defaultDuration: '5 Days' },
  ];

  for (const drug of commonDrugs) {
    await prisma.formularyDrug.create({
      data: {
        ...drug,
        isCommon: true,
      },
    });
  }
  console.log(`✅ ${commonDrugs.length} Formulary Drugs seeded.`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n--- Login Credentials ---');
  console.log('Super Admin: admin@clinixpulse.com / Admin@1234');
  console.log('Doctor (Gastro Cure & Apex): doctor@gastrocure.in / Doctor@1234');
  console.log('Receptionist: frontdesk@gastrocure.in / Doctor@1234');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
