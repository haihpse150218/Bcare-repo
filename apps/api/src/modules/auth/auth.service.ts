import { prisma } from "../../lib/prisma";
import { hash, compare } from "bcrypt";
import { RegisterInput, LoginInput, Role } from "@bcare/shared";

const BCRYPT_ROUNDS = 12;

export class AuthService {
  async register(input: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) throw { code: "EMAIL_EXISTS", message: "Email đã được sử dụng", status: 409 };

    const existingPhone = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (existingPhone) throw { code: "PHONE_EXISTS", message: "Số điện thoại đã được sử dụng", status: 409 };

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        fullName: input.fullName,
        role: input.role as Role,
      },
      select: { id: true, email: true, phone: true, fullName: true, role: true, avatarUrl: true },
    });

    return user;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng", status: 401 };

    const valid = await compare(input.password, user.passwordHash);
    if (!valid) throw { code: "INVALID_CREDENTIALS", message: "Email hoặc mật khẩu không đúng", status: 401 };

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, fullName: true, role: true, avatarUrl: true, isVerified: true },
    });
    if (!user) throw { code: "USER_NOT_FOUND", message: "Người dùng không tồn tại", status: 404 };
    return user;
  }

  async updateProfile(userId: string, data: { fullName?: string; phone?: string }) {
    const updateData: any = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.phone) updateData.phone = data.phone;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, phone: true, fullName: true, role: true, avatarUrl: true, isVerified: true },
    });
    return user;
  }
}

export const authService = new AuthService();
