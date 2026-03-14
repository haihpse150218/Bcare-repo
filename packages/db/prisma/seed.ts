import { PrismaClient, Role, VerificationStatus } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Specialties
  const specialties = await Promise.all([
    prisma.specialty.create({
      data: { name: "Tim mạch", slug: "tim-mach", icon: "heart-pulse", description: "Khám và điều trị các bệnh tim mạch" },
    }),
    prisma.specialty.create({
      data: { name: "Nha khoa", slug: "nha-khoa", icon: "smile", description: "Chăm sóc răng miệng" },
    }),
    prisma.specialty.create({
      data: { name: "Mắt", slug: "mat", icon: "eye", description: "Khám và điều trị các bệnh về mắt" },
    }),
    prisma.specialty.create({
      data: { name: "Da liễu", slug: "da-lieu", icon: "shield", description: "Khám và điều trị các bệnh da liễu" },
    }),
    prisma.specialty.create({
      data: { name: "Nội khoa", slug: "noi-khoa", icon: "stethoscope", description: "Khám nội tổng quát" },
    }),
    prisma.specialty.create({
      data: { name: "Nhi khoa", slug: "nhi-khoa", icon: "baby", description: "Khám và điều trị bệnh trẻ em" },
    }),
    prisma.specialty.create({
      data: { name: "Xương khớp", slug: "xuong-khop", icon: "bone", description: "Khám và điều trị cơ xương khớp" },
    }),
    prisma.specialty.create({
      data: { name: "Tai mũi họng", slug: "tai-mui-hong", icon: "ear", description: "Khám tai mũi họng" },
    }),
  ]);

  // Admin user
  const adminPassword = await hash("Admin@123456", 12);
  await prisma.user.create({
    data: {
      email: "admin@bcare.vn",
      phone: "0900000000",
      passwordHash: adminPassword,
      fullName: "BCare Admin",
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  // Clinic user + clinic
  const clinicPassword = await hash("Clinic@123456", 12);
  const clinicUser = await prisma.user.create({
    data: {
      email: "clinic@bcare.vn",
      phone: "0900000001",
      passwordHash: clinicPassword,
      fullName: "Phòng khám Đa khoa Sài Gòn",
      role: Role.CLINIC,
      isVerified: true,
    },
  });

  const clinic = await prisma.clinic.create({
    data: {
      userId: clinicUser.id,
      name: "Phòng khám Đa khoa Sài Gòn",
      slug: "phong-kham-da-khoa-sai-gon",
      address: "123 Nguyễn Huệ, Quận 1",
      district: "Quận 1",
      city: "Hồ Chí Minh",
      lat: 10.7769,
      lng: 106.7009,
      phone: "028 1234 5678",
      description: "Phòng khám đa khoa hiện đại với đội ngũ bác sĩ giàu kinh nghiệm",
      verificationStatus: VerificationStatus.VERIFIED,
    },
  });

  // Doctor users
  const doctorPassword = await hash("Doctor@123456", 12);
  const doctorData = [
    { name: "BS. Nguyễn Văn An", email: "doctor1@bcare.vn", phone: "0900000010", specialty: 0, title: "PGS.TS", exp: 15, fee: 500000 },
    { name: "BS. Trần Thị Bình", email: "doctor2@bcare.vn", phone: "0900000011", specialty: 1, title: "ThS.BS", exp: 10, fee: 400000 },
    { name: "BS. Lê Hoàng Cường", email: "doctor3@bcare.vn", phone: "0900000012", specialty: 2, title: "TS.BS", exp: 12, fee: 450000 },
    { name: "BS. Phạm Minh Đức", email: "doctor4@bcare.vn", phone: "0900000013", specialty: 4, title: "BS.CKI", exp: 8, fee: 350000 },
    { name: "BS. Hoàng Thị Lan", email: "doctor5@bcare.vn", phone: "0900000014", specialty: 5, title: "PGS.TS", exp: 20, fee: 600000 },
  ];

  for (const d of doctorData) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        phone: d.phone,
        passwordHash: doctorPassword,
        fullName: d.name,
        role: Role.DOCTOR,
        isVerified: true,
      },
    });

    const doctor = await prisma.doctor.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
        specialtyId: specialties[d.specialty].id,
        slug: d.email.replace("@bcare.vn", ""),
        title: d.title,
        bio: `Bác sĩ ${d.name} có ${d.exp} năm kinh nghiệm.`,
        experienceYears: d.exp,
        consultationFee: d.fee,
        ratingAvg: 4.5 + Math.random() * 0.5,
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    // Schedules: Mon-Fri
    for (let day = 1; day <= 5; day++) {
      await prisma.schedule.create({
        data: {
          doctorId: doctor.id,
          dayOfWeek: day,
          startTime: "08:00",
          endTime: "17:00",
          slotDuration: 30,
        },
      });
    }
  }

  // Patient user
  const patientPassword = await hash("Patient@123456", 12);
  await prisma.user.create({
    data: {
      email: "patient@bcare.vn",
      phone: "0900000020",
      passwordHash: patientPassword,
      fullName: "Nguyễn Văn Bệnh Nhân",
      role: Role.PATIENT,
      isVerified: true,
    },
  });

  // Staff user
  const staffPassword = await hash("Staff@123456", 12);
  const staffUser = await prisma.user.create({
    data: {
      email: "staff@bcare.vn",
      phone: "0900000030",
      passwordHash: staffPassword,
      fullName: "Lê Thị Lễ Tân",
      role: Role.STAFF,
      isVerified: true,
    },
  });

  await prisma.staff.create({
    data: {
      userId: staffUser.id,
      clinicId: clinic.id,
      position: "Lễ tân",
      permissions: ["manage_appointments", "view_patients"],
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
